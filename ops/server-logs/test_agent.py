import importlib.util
import io
import json
from pathlib import Path
import tempfile
import sys
import threading
from types import SimpleNamespace
import unittest
from unittest.mock import patch
import urllib.error
import urllib.request


def load_module(name, filename):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(filename))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


agent = load_module('agent', 'agent.py')
deploy = load_module('deploy', 'deploy.py')


class ReaderTests(unittest.TestCase):
    def test_redacts_secrets_and_preserves_stack(self):
        content = ('ERROR failure\n at app.Service.run(Service.java:42)\n'
                   'Authorization: Bearer test-secret\nCookie: session=private; other=hidden\n'
                   '{"password":"private-value","api_key":"private-key"}\n'
                   '{"password":"escaped\\\"private-tail"}\n'
                   '/request?token=private-token&x=ok\nBearer other-secret\n'
                   'eyJabcdefghijk.payload.signature\n<script>alert(1)</script>')
        result = agent.redact(content)
        for secret in ('test-secret', 'private', 'hidden', 'other-secret', 'eyJabcdefghijk'):
            self.assertNotIn(secret, result)
        self.assertIn('Service.java:42', result)
        self.assertIn('<script>', result)  # Frontend must escape, not render HTML.
        self.assertIn('x=ok', result)

    def test_tail_is_bounded_and_ends_at_last_line(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'access.log'
            path.write_bytes(b'old-line\n' * 90000 + b'last-line\n')
            raw, truncated = agent.file_tail(str(path))
            self.assertLessEqual(len(raw), agent.MAX_BYTES)
            self.assertTrue(truncated)
            self.assertTrue(raw.endswith(b'last-line\n'))

    def test_does_not_follow_symlinks(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'linked.log'
            path.symlink_to('/etc/passwd')
            with self.assertRaises(OSError):
                agent.file_tail(str(path))

    def test_exact_whitelist_and_line_limits(self):
        for source, limit in [('/etc/passwd', 100), ('carbon;id', 100), ('carbon', 10000), ('carbon', -1)]:
            with self.assertRaises(agent.LogError) as caught:
                agent.read_source(source, limit)
            self.assertEqual(caught.exception.status, 400)

    def test_last_lines_and_masking(self):
        raw = ''.join(f'{i}: password=secret\n' for i in range(300)).encode()
        with patch.object(agent, 'docker_tail', return_value=(raw, False)):
            result = agent.read_source('carbon', 100)
        self.assertEqual(len(result['lines']), 100)
        self.assertTrue(result['lines'][0].startswith('200:'))
        self.assertNotIn('secret', '\n'.join(result['lines']))

    def test_missing_source_fails_without_content(self):
        with patch.object(agent, 'file_tail', side_effect=FileNotFoundError('private-path')):
            with self.assertRaises(agent.LogError) as caught:
                agent.read_source('nginx-error', 100)
        self.assertEqual(caught.exception.status, 503)
        self.assertNotIn('private-path', str(caught.exception))

    def test_docker_command_is_fixed_and_timeout_kills_process(self):
        with patch.object(agent.subprocess, 'Popen') as popen, patch.object(agent.selectors, 'DefaultSelector'), patch.object(agent.time, 'monotonic', side_effect=[0, 5]):
            popen.return_value.poll.return_value = None
            with self.assertRaises(agent.LogError) as caught:
                agent.docker_tail(100)
            self.assertEqual(caught.exception.status, 503)
            self.assertEqual(popen.call_args.args[0], ['/usr/bin/docker', 'logs', '--timestamps', '--tail', '100', 'carbon-app'])
            popen.return_value.kill.assert_called_once()
            # Timeout still waits/closes the pipe (cleanup always executes).
            popen.return_value.wait.assert_called()
            popen.return_value.stdout.close.assert_called_once()

    def test_mysql_uses_only_fixed_container_command(self):
        with patch.object(agent, 'command_tail', return_value=(b'safe\n', False)) as reader:
            self.assertEqual(agent.read_source('mysql', 100)['lines'], ['safe'])
            self.assertEqual(reader.call_args.args[0], ['/usr/bin/docker', 'logs', '--timestamps', '--tail', '100', 'main-mysql'])
        with self.assertRaises(agent.LogError):
            agent.docker_tail(100, 'unapproved-container')

    def test_docker_and_cron_filter_bounded_syslog_without_commands(self):
        fixture = b'host dockerd[123]: Docker event\nhost CRON[456]: cron event\nhost other[7]: irrelevant\n'
        with patch.object(agent, 'file_tail', return_value=(fixture, True)) as reader, patch.object(agent, 'command_tail') as command:
            self.assertEqual(agent.read_source('ecs-docker', 100)['lines'], ['host dockerd[123]: Docker event'])
            result = agent.read_source('cron', 200)
            self.assertEqual(result['lines'], ['host CRON[456]: cron event'])
            self.assertTrue(result['truncated'])
            self.assertTrue(all(call.args[0] == '/var/log/syslog' for call in reader.call_args_list))
            command.assert_not_called()

    def test_empty_kernel_file_uses_only_fixed_previous_rotation(self):
        with patch.object(agent, 'file_tail', side_effect=[(b'', False), (b'previous kernel entry\n', False)]) as reader:
            self.assertEqual(agent.read_source('ecs-kernel', 100)['lines'], ['previous kernel entry'])
            self.assertEqual([call.args[0] for call in reader.call_args_list], ['/var/log/kern.log', '/var/log/kern.log.1'])

    def test_command_reader_caps_output(self):
        content, truncated = agent.command_tail([sys.executable, '-c', 'print("x" * 700000); print("last-line")'], 'fixture failed')
        self.assertTrue(truncated)
        self.assertLessEqual(len(content), agent.MAX_BYTES)
        self.assertTrue(content.endswith(b'last-line\n'))


class MaintenanceTests(unittest.TestCase):
    def test_cron_parses_only_actual_whitelisted_script_execution(self):
        text = ('# 0 3 * * * /root/ops/backup_mysql.sh\n'
                '0 3 * * * /root/ops/backup_mysql.sh >> /var/log/log 2>&1\n'
                '@weekly /bin/bash /root/ops/backup_mysql.sh\n'
                '0 4 * * * echo /root/ops/backup_mysql.sh\n'
                'broken /root/ops/backup_mysql.sh\n'
                '@invalid /root/ops/backup_mysql.sh\n')
        self.assertEqual(agent.cron_schedules(text, '/root/ops/backup_mysql.sh'), ['0 3 * * *', '@weekly'])
        self.assertEqual(agent.cron_schedules('51 5 * * * "/root/.acme.sh"/acme.sh --cron', '/root/.acme.sh/acme.sh'), ['51 5 * * *'])

    def test_backup_records_only_stat_whitelisted_regular_files(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'carbon_20261005_030001.sql.gz').write_bytes(b'fixture-only')
            (root / 'carbon_20261005_030002.sql.gz.partial').write_bytes(b'partial')
            (root / 'private-password.sql').write_text('never return this content')
            (root / 'carbon_20261005_030003.sql.gz').symlink_to('/etc/passwd')
            with patch.object(agent, 'BACKUP_DIR', str(root)), patch('builtins.open', side_effect=AssertionError('must not read SQL')):
                records, limited, available = agent.backup_records()
            self.assertTrue(available)
            self.assertFalse(limited)
            self.assertEqual(len(records), 2)
            self.assertTrue(any(record['partial'] for record in records))
            self.assertNotIn('never return this content', str(records))

    def test_missing_or_symlink_backup_directory_is_unavailable(self):
        with tempfile.TemporaryDirectory() as directory:
            linked = Path(directory) / 'link'
            linked.symlink_to(directory)
            for path in (str(linked), str(linked) + '-missing'):
                with patch.object(agent, 'BACKUP_DIR', path):
                    self.assertEqual(agent.backup_records(), ([], False, False))

    def test_small_metadata_files_are_bounded_and_no_symlinks(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            path = root / 'large'
            path.write_text('x' * 40000)
            linked = root / 'linked'
            linked.symlink_to(path)
            for candidate in (path, linked):
                with self.assertRaises(OSError):
                    agent.read_small(str(candidate))

    def test_overview_preserves_configuration_and_redacts_outcome(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            script = root / 'backup.sh'
            script.write_text('LOCAL_RETENTION_DAYS=7\nOSS_BUCKET=fixture-bucket\nOSS_PREFIX=database/carbon\nPASSWORD=private-value\n# --storage-class Archive\n')
            script.chmod(0o700)
            cron = root / 'crontab'
            cron.write_text('0 3 * * * ' + str(script) + '\nUNRELATED_SECRET=never-return\n')
            log = root / 'backup.log'
            log.write_text('[2026-10-05 03:00:00] OK: complete\n[2026-10-05 03:01:00] ERROR: password=private-outcome\n')
            cert = root / 'cert.log'
            cert.write_text('{"Code":"CdnServiceSuspended"}\n')
            tasks = [('mysql-backup', 'Backup', str(script), 'mysql-backup'), ('cert-sync', 'Certificate', str(script), 'cert-sync')]
            with patch.multiple(agent, CRONTAB=str(cron), BACKUP_SCRIPT=str(script), BACKUP_DIR=str(root), TASKS=tasks), patch.dict(agent.SOURCES, {'mysql-backup': str(log), 'cert-sync': str(cert)}), patch.object(agent.subprocess, 'Popen') as process:
                result = agent.read_maintenance()
                process.assert_not_called()  # Must never execute cron, backup or MySQL commands.
            self.assertEqual(result['backup']['latestOutcome']['status'], 'failed')
            self.assertEqual(result['backup']['localRetentionDays'], 7)
            self.assertEqual(result['backup']['destination']['bucket'], 'fixture-bucket')
            self.assertEqual(result['tasks'][0]['schedules'], ['0 3 * * *'])
            self.assertIn('CdnServiceSuspended', result['tasks'][1]['logWarning'])
            for secret in ('private-value', 'private-outcome', 'never-return'):
                self.assertNotIn(secret, json.dumps(result))

    def test_unavailable_configuration_never_implies_success(self):
        with patch.object(agent, 'read_small', side_effect=OSError), patch.object(agent, 'file_tail', side_effect=OSError), patch.object(agent, 'backup_records', return_value=([], False, False)):
            result = agent.read_maintenance()
        self.assertFalse(result['cronAvailable'])
        self.assertTrue(all(not task['configured'] for task in result['tasks']))
        self.assertEqual(result['backup']['latestOutcome']['status'], 'unknown')


class AuthTests(unittest.TestCase):
    def authenticate(self, info):
        with patch.object(agent.urllib.request, 'build_opener') as opener:
            opener.return_value.open.return_value.__enter__.return_value = io.BytesIO(json.dumps(info).encode())
            agent.verify_admin('Bearer test-token')
            request = opener.return_value.open.call_args.args[0]
            self.assertEqual(request.full_url, 'http://127.0.0.1:9090/getInfo')
            self.assertEqual(request.get_header('Authorization'), 'Bearer test-token')

    def test_admin_from_authoritative_backend(self):
        for info in [dict(user={'userId': 1}), dict(user={'userId': 2}, roles=['admin']), dict(user={'userId': 2}, permissions=['*:*:*'])]:
            self.authenticate({'code': 200, **info})

    def test_non_admin_rejected(self):
        with self.assertRaises(agent.LogError) as caught:
            self.authenticate({'code': 200, 'user': {'userId': 2}, 'roles': ['common'], 'permissions': []})
        self.assertEqual(caught.exception.status, 403)

    def test_missing_and_bad_bearer(self):
        for value in [None, '', 'Basic credentials', 'Bearer bad\nheader']:
            with self.assertRaises(agent.LogError) as caught:
                agent.verify_admin(value)
            self.assertEqual(caught.exception.status, 401)

    def test_business_401_and_incomplete_auth(self):
        for info, status in [({'code': 401}, 401), ({'code': 200, 'roles': ['admin']}, 503), ({'code': 500}, 503)]:
            with self.assertRaises(agent.LogError) as caught:
                self.authenticate(info)
            self.assertEqual(caught.exception.status, status)

    def test_backend_failure_fails_closed(self):
        with patch.object(agent.urllib.request, 'build_opener') as opener:
            opener.return_value.open.side_effect = OSError('internal message')
            with self.assertRaises(agent.LogError) as caught:
                agent.verify_admin('Bearer test-token')
        self.assertEqual(caught.exception.status, 503)
        self.assertNotIn('internal message', str(caught.exception))


class EndpointTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = agent.ThreadingHTTPServer(('127.0.0.1', 0), agent.Handler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.url = 'http://127.0.0.1:' + str(cls.server.server_port)

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()

    def request(self, path, method='GET'):
        request = urllib.request.Request(self.url + path, method=method)
        try:
            response = urllib.request.urlopen(request, timeout=3)
        except urllib.error.HTTPError as error:
            response = error
        with response:
            return response.status, response.headers, json.loads(response.read())

    def test_unauthenticated_never_reads_logs(self):
        with patch.object(agent, 'read_source') as reader:
            status, headers, _ = self.request('/api/admin/server-logs/tail?source=carbon&lines=100')
        self.assertEqual(status, 401)
        self.assertIn('no-store', headers['Cache-Control'])
        reader.assert_not_called()

    def test_admin_snapshot_and_invalid_parameters(self):
        with patch.object(agent, 'verify_admin'), patch.object(agent, 'read_source', return_value={'source': 'carbon', 'lines': ['safe']}) as reader:
            self.assertEqual(self.request('/api/admin/server-logs/tail?source=carbon&lines=100')[0], 200)
            reader.assert_called_once_with('carbon', 100)
            for query in ['source=carbon&lines=100&path=/etc/passwd', 'source=carbon&source=other&lines=100', 'source=carbon&lines=99999', 'source=carbon']:
                self.assertEqual(self.request('/api/admin/server-logs/tail?' + query)[0], 400)
            self.assertEqual(reader.call_count, 1)

    def test_write_methods_and_other_paths_denied(self):
        self.assertEqual(self.request('/api/admin/server-logs/tail', method='POST')[0], 405)
        self.assertEqual(self.request('/api/admin/server-logs/exec')[0], 404)

    def test_non_admin_and_auth_failure_never_read_logs(self):
        for status in (403, 503):
            with patch.object(agent, 'verify_admin', side_effect=agent.LogError(status, 'denied')), patch.object(agent, 'read_source') as reader:
                self.assertEqual(self.request('/api/admin/server-logs/tail?source=carbon&lines=100')[0], status)
                reader.assert_not_called()

    def test_maintenance_requires_admin_and_rejects_command_parameters(self):
        with patch.object(agent, 'read_maintenance') as reader:
            self.assertEqual(self.request('/api/admin/server-logs/maintenance')[0], 401)
            reader.assert_not_called()
        with patch.object(agent, 'verify_admin'), patch.object(agent, 'read_maintenance', return_value={'tasks': []}) as reader:
            status, headers, data = self.request('/api/admin/server-logs/maintenance')
            self.assertEqual(status, 200)
            self.assertEqual(data['data']['tasks'], [])
            self.assertIn('no-store', headers['Cache-Control'])
            self.assertEqual(self.request('/api/admin/server-logs/maintenance?command=backup')[0], 400)
            self.assertEqual(self.request('/api/admin/server-logs/maintenance?path=/etc/passwd')[0], 400)
            self.assertEqual(self.request('/api/admin/server-logs/maintenance', method='POST')[0], 405)
            reader.assert_called_once()


class DeployTests(unittest.TestCase):
    def test_nginx_location_is_idempotent_and_specific(self):
        original = 'server {\n        location /api/admin/ {\n        }\n}\n'
        updated = deploy.config_with_location(original)
        self.assertEqual(deploy.config_with_location(updated), updated)
        self.assertEqual(updated.count('location ^~ /api/admin/server-logs/'), 1)
        self.assertIn('proxy_set_header Authorization $http_authorization;', updated)
        self.assertIn('no-store, private', updated)
        self.assertIn('location /api/admin/', updated)

    def test_ambiguous_config_fails_before_writes(self):
        with self.assertRaises(RuntimeError):
            deploy.config_with_location('server {}')
        with self.assertRaises(RuntimeError):
            deploy.config_with_location('        location /api/admin/ {' * 2)

    def test_failed_install_restores_original_files(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            stage = root / 'stage'
            stage.mkdir()
            (stage / 'agent.py').write_text('print("new")\n')
            (stage / 'blog-server-log-agent.service').write_text('[Service]\n')
            config = root / 'nginx.conf'
            original = 'server {\n        location /api/admin/ {\n        }\n}\n'
            config.write_text(original)
            installed = root / 'installed' / 'agent.py'
            installed.parent.mkdir()
            installed.write_text('print("old")\n')
            unit = root / 'unit' / 'blog-server-log-agent.service'
            with patch.multiple(deploy, STAGE=stage, AGENT=installed, UNIT=unit, CONFIG=config), patch.object(deploy, 'run', return_value=SimpleNamespace(returncode=1)), patch.object(deploy, 'healthy', side_effect=RuntimeError('fail')):
                with self.assertRaises(RuntimeError):
                    deploy.main()
            self.assertEqual(config.read_text(), original)
            self.assertEqual(installed.read_text(), 'print("old")\n')
            self.assertFalse(unit.exists())
            self.assertEqual(len(list((stage / 'backups').glob('*/manifest.json'))), 1)


if __name__ == '__main__':
    unittest.main()

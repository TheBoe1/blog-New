import importlib.util
import io
import json
from pathlib import Path
import tempfile
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

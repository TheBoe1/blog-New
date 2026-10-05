#!/usr/bin/env python3
"""Bounded, read-only log snapshots behind nginx and existing Carbon admin auth."""
import argparse
import collections
import datetime
import json
import os
import re
import selectors
import shlex
import stat
import subprocess
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

MAX_BYTES = 512 * 1024
LINE_LIMITS = {100, 200, 500, 1000}
SOURCES = {
    'carbon': None, 'mysql': None,
    'nginx-access': '/root/nginx/logs/access.log', 'nginx-error': '/root/nginx/logs/error.log',
    'ecs-system': '/var/log/syslog', 'ecs-auth': '/var/log/auth.log',
    'ecs-kernel': '/var/log/kern.log', 'ecs-docker': '/var/log/syslog', 'cron': '/var/log/syslog',
    'mysql-backup': '/var/log/backup_mysql.log', 'docker-cleanup': '/var/log/cleanup-docker-logs.log',
    'cert-sync': '/var/log/oss-cert-sync.log',
}
SYSTEM_FILTERS = {'ecs-docker': re.compile(r'\b(?:dockerd|containerd)(?:\[|:|\s)'),
                  'cron': re.compile(r'\b(?:CRON|cron)(?:\[|:|\s)')}
KERNEL_PREVIOUS = '/var/log/kern.log.1'
CRONTAB = '/var/spool/cron/crontabs/root'
BACKUP_DIR = '/backup/mysql'
BACKUP_SCRIPT = '/root/ops/backup_mysql.sh'
TASKS = [
    ('mysql-backup', 'MySQL 数据库备份', BACKUP_SCRIPT, 'mysql-backup'),
    ('docker-cleanup', 'Docker 日志清理', '/root/ops/scripts/cleanup-docker-logs.sh', 'docker-cleanup'),
    ('cert-sync', 'OSS / CDN 证书同步', '/root/bin/sync_certs.py', 'cert-sync'),
    ('acme-renew', 'ACME 证书续期', '/root/.acme.sh/acme.sh', None),
]
AUTH_URL = 'http://127.0.0.1:9090/getInfo'
SLOTS = threading.BoundedSemaphore(8)
ANSI = re.compile(r'\x1b\[[0-?]*[ -/]*[@-~]')
SECRETS = re.compile(r'''(?i)(["']?(?:password|passwd|pwd|token|access[_-]?token|refresh[_-]?token|api[_-]?key|access[_-]?key[_-]?secret|secret|authorization|cookie|set-cookie)["']?\s*[:=]\s*)(?:"(?:\\.|[^"\\\r\n])*"|'(?:\\.|[^'\\\r\n])*'|[^\s&,;\r\n]+)''')
BEARER = re.compile(r'(?i)\bBearer\s+[A-Za-z0-9._~+/=-]+')
JWT = re.compile(r'\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b')
HEADER_SECRETS = re.compile(r'(?im)\b(authorization|cookie|set-cookie)\s*:\s*[^\r\n]+')


class LogError(Exception):
    def __init__(self, status, message):
        super().__init__(message)
        self.status = status


def redact(text):
    text = ANSI.sub('', text)
    text = HEADER_SECRETS.sub(lambda m: m.group(1) + ': [REDACTED]', text)
    text = BEARER.sub('Bearer [REDACTED]', text)
    text = JWT.sub('[REDACTED]', text)
    return SECRETS.sub(lambda m: m.group(1) + '[REDACTED]', text)


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None


def verify_admin(authorization):
    if not authorization or len(authorization) > 4096 or not re.fullmatch(r'Bearer [A-Za-z0-9._~+/=-]+', authorization):
        raise LogError(401, '请先登录管理员账号')
    request = urllib.request.Request(AUTH_URL, headers={'Authorization': authorization})
    try:
        # Fixed local URL, no proxies or redirects: never forward tokens elsewhere.
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect())
        with opener.open(request, timeout=3) as response:
            raw = response.read(256 * 1024 + 1)
        if len(raw) > 256 * 1024:
            raise ValueError('oversized auth response')
        info = json.loads(raw)
        if not isinstance(info, dict):
            raise ValueError('invalid auth response')
    except urllib.error.HTTPError as error:
        raise LogError(error.code if error.code in (401, 403) else 503, '身份校验失败') from None
    except (OSError, ValueError):
        raise LogError(503, '管理员身份校验服务暂不可用') from None
    if info.get('code') != 200:
        status = info.get('code')
        raise LogError(status if status in (401, 403) else 503, '管理员身份校验失败')
    user, roles, permissions = info.get('user'), info.get('roles'), info.get('permissions')
    if not isinstance(user, dict) or not user.get('userId'):
        raise LogError(503, '身份校验响应不完整')
    if (user.get('userId') == 1 or isinstance(roles, list) and 'admin' in roles
            or isinstance(permissions, list) and '*:*:*' in permissions):
        return
    raise LogError(403, '仅管理员可查看服务器日志')


def file_tail(path):
    # Fixed whitelist, no symlinks; seek from end instead of reading all history.
    descriptor = os.open(path, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
    with os.fdopen(descriptor, 'rb') as stream:
        size = stream.seek(0, os.SEEK_END)
        start = max(0, size - MAX_BYTES)
        stream.seek(start)
        content = stream.read(MAX_BYTES)
    if start:
        content = content.partition(b'\n')[2]
    return content, bool(start)


def command_tail(command, failure):
    process = subprocess.Popen(
        command,
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT, stdin=subprocess.DEVNULL,
        env={'PATH': '/usr/bin:/bin', 'DOCKER_HOST': 'unix:///var/run/docker.sock'},
    )
    content, truncated, deadline = bytearray(), False, time.monotonic() + 4
    try:
        with selectors.DefaultSelector() as selector:
            selector.register(process.stdout, selectors.EVENT_READ)
            while selector.get_map():
                remaining = deadline - time.monotonic()
                if remaining <= 0:
                    raise LogError(503, failure + '（读取超时）')
                for key, _ in selector.select(min(remaining, 0.2)):
                    chunk = os.read(key.fileobj.fileno(), 65536)
                    if not chunk:
                        selector.unregister(key.fileobj)
                        break
                    content.extend(chunk)
                    if len(content) > MAX_BYTES:
                        del content[:-MAX_BYTES]
                        truncated = True
        if process.wait(timeout=max(0.1, deadline - time.monotonic())):
            raise LogError(503, failure)
    finally:
        if process.poll() is None:
            process.kill()
        process.wait()
        process.stdout.close()
    if truncated:
        content = content.partition(b'\n')[2]
    return bytes(content), truncated


def docker_tail(lines, container='carbon-app'):
    if container not in {'carbon-app', 'main-mysql'}:
        raise LogError(400, '容器无效')
    return command_tail(['/usr/bin/docker', 'logs', '--timestamps', '--tail', str(lines), container], '容器日志暂不可用')


def read_source(source, lines):
    if source not in SOURCES or lines not in LINE_LIMITS:
        raise LogError(400, '日志来源或行数无效')
    try:
        if source in ('carbon', 'mysql'):
            raw, truncated = docker_tail(lines, 'main-mysql') if source == 'mysql' else docker_tail(lines)
        else:
            raw, truncated = file_tail(SOURCES[source])
            if source == 'ecs-kernel' and not raw.strip():
                try:
                    raw, truncated = file_tail(KERNEL_PREVIOUS)
                except FileNotFoundError:
                    pass
    except LogError:
        raise
    except (OSError, subprocess.SubprocessError):
        raise LogError(503, '日志源暂不可读取') from None
    entries = redact(raw.decode('utf-8', errors='replace')).splitlines()
    if source in SYSTEM_FILTERS:
        entries = [line for line in entries if SYSTEM_FILTERS[source].search(line)]
    result = list(collections.deque(entries, maxlen=lines))
    return {'source': source, 'lines': result, 'truncated': truncated,
            'fetchedAt': datetime.datetime.now(datetime.timezone.utc).isoformat()}


def read_small(path, limit=32768):
    descriptor = os.open(path, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
    with os.fdopen(descriptor, 'rb') as stream:
        if not stat.S_ISREG(os.fstat(stream.fileno()).st_mode):
            raise OSError('not a regular file')
        content = stream.read(limit + 1)
    if len(content) > limit:
        raise OSError('file exceeds inspection limit')
    return content.decode('utf-8', errors='replace')


def cron_schedules(text, script):
    schedules = []
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        parts = line.split(None, 1) if line.startswith('@') else line.split(None, 5)
        if line.startswith('@'):
            if len(parts) != 2 or parts[0] not in {'@reboot', '@yearly', '@annually', '@monthly', '@weekly', '@daily', '@midnight', '@hourly'}:
                continue
        elif len(parts) != 6:
            continue
        try:
            command = shlex.split(parts[-1])
        except ValueError:
            continue
        # Recognize actual fixed scripts, not text echoed by another command.
        matches = command and (command[0] == script or len(command) > 1
                  and command[0] in {'bash', '/bin/bash', 'sh', '/bin/sh', 'python3', '/usr/bin/python3'}
                  and command[1] == script)
        if matches:
            schedules.append(' '.join(parts[:-1]))
    return schedules


def iso_time(timestamp):
    return datetime.datetime.fromtimestamp(timestamp, datetime.timezone.utc).isoformat()


def backup_records():
    records, limited, descriptor = [], False, None
    try:
        descriptor = os.open(BACKUP_DIR, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
        with os.scandir(descriptor) as entries:
            for index, entry in enumerate(entries):
                if index >= 1000:
                    limited = True
                    break
                if not re.fullmatch(r'carbon_\d{8}_\d{6}\.sql\.gz(?:\.partial)?', entry.name):
                    continue
                try:
                    info = entry.stat(follow_symlinks=False)
                except OSError:
                    continue  # The existing rotation script may remove a file during inspection.
                if stat.S_ISREG(info.st_mode):
                    records.append({'name': entry.name, 'bytes': info.st_size, 'modifiedAt': iso_time(info.st_mtime),
                                    'partial': entry.name.endswith('.partial')})
        records.sort(key=lambda item: item['modifiedAt'], reverse=True)
        return records[:100], limited or len(records) > 100, True
    except OSError:
        return [], False, False
    finally:
        if descriptor is not None:
            os.close(descriptor)


def backup_settings():
    try:
        text = read_small(BACKUP_SCRIPT)
    except OSError:
        return None, None
    def setting(name):
        match = re.search(r'^' + name + r'=["\']?([a-zA-Z0-9_./-]+)["\']?\s*$', text, re.MULTILINE)
        return match.group(1) if match else None
    retention = setting('LOCAL_RETENTION_DAYS')
    bucket, prefix = setting('OSS_BUCKET'), setting('OSS_PREFIX')
    storage = re.search(r'--storage-class\s+(\w+)', text)
    destination = {'bucket': bucket, 'prefix': prefix, 'storageClass': storage.group(1) if storage else '未声明'} if bucket and prefix else None
    return int(retention) if retention and retention.isdigit() else None, destination


def read_maintenance():
    try:
        cron, cron_available = read_small(CRONTAB), True
    except OSError:
        cron, cron_available = '', False
    tasks = []
    backup_text = ''
    for task_id, name, script, source in TASKS:
        try:
            mode = os.stat(script, follow_symlinks=False).st_mode
            script_available = stat.S_ISREG(mode) and bool(mode & 0o111)
        except OSError:
            script_available = False
        updated = None
        warning = None
        if source:
            try:
                updated = iso_time(os.stat(SOURCES[source], follow_symlinks=False).st_mtime)
            except OSError:
                pass
        if task_id == 'mysql-backup':
            try:
                raw, _ = file_tail(SOURCES[source])
                backup_text = redact(raw.decode('utf-8', errors='replace'))
            except OSError:
                pass
        elif task_id == 'cert-sync':
            try:
                raw, _ = file_tail(SOURCES[source])
                latest_lines = raw.decode('utf-8', errors='replace').splitlines()[-20:]
                if any('CdnServiceSuspended' in line for line in latest_lines):
                    warning = '近期证书同步日志报告 CdnServiceSuspended，需核查 CDN 服务状态。'
            except OSError:
                pass
        schedules = cron_schedules(cron, script)
        tasks.append({'id': task_id, 'name': name, 'script': script, 'schedules': schedules,
                      'configured': bool(schedules), 'scriptAvailable': script_available,
                      'logSource': source, 'logUpdatedAt': updated, 'logWarning': warning})
    outcome = {'status': 'unknown', 'at': None, 'message': '尚未读取到明确的备份完成或失败记录'}
    # Only explicit terminal markers imply success/failure, never file mtime alone.
    for line in reversed(backup_text.splitlines()):
        marker = re.match(r'^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] (OK|ERROR): (.*)', line)
        if marker:
            when = datetime.datetime.fromisoformat(marker.group(1)).astimezone(datetime.timezone.utc)
            outcome = {'status': 'success' if marker.group(2) == 'OK' else 'failed',
                       'at': when.isoformat(), 'message': marker.group(3)[:500]}
            break
    records, limited, available = backup_records()
    retention, destination = backup_settings()
    return {'fetchedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'timezone': datetime.datetime.now().astimezone().strftime('%Z (UTC%z)'),
            'cronAvailable': cron_available, 'tasks': tasks,
            'backup': {'directory': BACKUP_DIR, 'available': available, 'records': records, 'limited': limited,
                       'localRetentionDays': retention, 'destination': destination, 'latestOutcome': outcome}}


class Handler(BaseHTTPRequestHandler):
    def setup(self):
        super().setup()
        self.connection.settimeout(5)

    def log_message(self, *args):
        pass  # Do not log URLs, tokens or returned contents.

    def reply(self, status, data):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', 'no-store, private')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == '/health':
            self.reply(200, {'status': 'ok'})
            return
        if not SLOTS.acquire(blocking=False):
            self.reply(503, {'code': 503, 'msg': '日志读取繁忙，请稍后重试'})
            return
        try:
            if len(self.path) > 2048:
                raise LogError(400, '请求参数过长')
            url = urllib.parse.urlsplit(self.path)
            if url.path not in {'/api/admin/server-logs/tail', '/api/admin/server-logs/maintenance'}:
                raise LogError(404, '接口不存在')
            verify_admin(self.headers.get('Authorization'))
            query = urllib.parse.parse_qs(url.query, keep_blank_values=True, max_num_fields=4)
            if url.path.endswith('/maintenance'):
                if query:
                    raise LogError(400, '任务概览不接受路径或命令参数')
                self.reply(200, {'code': 200, 'data': read_maintenance()})
                return
            if set(query) != {'source', 'lines'} or any(len(values) != 1 for values in query.values()):
                raise LogError(400, '仅支持日志来源与最近行数')
            source = query['source'][0]
            if query['lines'][0] not in {'100', '200', '500', '1000'}:
                raise LogError(400, '行数无效')
            self.reply(200, {'code': 200, 'data': read_source(source, int(query['lines'][0]))})
        except LogError as error:
            self.reply(error.status, {'code': error.status, 'msg': str(error)})
        except ValueError:
            self.reply(400, {'code': 400, 'msg': '请求参数无效'})
        except (ConnectionError, TimeoutError):
            pass
        except Exception:
            self.reply(503, {'code': 503, 'msg': '日志服务暂不可用'})
        finally:
            SLOTS.release()

    def do_POST(self):
        self.reply(405, {'code': 405, 'msg': '日志接口仅支持只读查询'})

    do_PUT = do_DELETE = do_PATCH = do_HEAD = do_POST


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--bind', default='127.0.0.1')
    parser.add_argument('--port', type=int, default=9126)
    args = parser.parse_args()
    server = ThreadingHTTPServer((args.bind, args.port), Handler)
    server.daemon_threads = True
    server.serve_forever()

#!/usr/bin/env python3
"""Bounded, read-only log snapshots behind nginx and existing Carbon admin auth."""
import argparse
import collections
import datetime
import json
import os
import re
import selectors
import subprocess
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

MAX_BYTES = 512 * 1024
LINE_LIMITS = {100, 200, 500, 1000}
SOURCES = {'carbon': None, 'nginx-access': '/root/nginx/logs/access.log', 'nginx-error': '/root/nginx/logs/error.log'}
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


def docker_tail(lines):
    process = subprocess.Popen(
        ['/usr/bin/docker', 'logs', '--timestamps', '--tail', str(lines), 'carbon-app'],
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
                    raise LogError(503, '后端日志读取超时')
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
            raise LogError(503, '后端日志暂不可用')
    finally:
        if process.poll() is None:
            process.kill()
        process.wait()
        process.stdout.close()
    if truncated:
        content = content.partition(b'\n')[2]
    return bytes(content), truncated


def read_source(source, lines):
    if source not in SOURCES or lines not in LINE_LIMITS:
        raise LogError(400, '日志来源或行数无效')
    try:
        raw, truncated = docker_tail(lines) if source == 'carbon' else file_tail(SOURCES[source])
    except LogError:
        raise
    except (OSError, subprocess.SubprocessError):
        raise LogError(503, '日志源暂不可读取') from None
    result = list(collections.deque(redact(raw.decode('utf-8', errors='replace')).splitlines(), maxlen=lines))
    return {'source': source, 'lines': result, 'truncated': truncated,
            'fetchedAt': datetime.datetime.now(datetime.timezone.utc).isoformat()}


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
            if url.path != '/api/admin/server-logs/tail':
                raise LogError(404, '接口不存在')
            verify_admin(self.headers.get('Authorization'))
            query = urllib.parse.parse_qs(url.query, keep_blank_values=True, max_num_fields=4)
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

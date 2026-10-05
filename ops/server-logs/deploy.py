#!/usr/bin/env python3
"""Idempotent ECS install, nginx validation and rollback. Run as root after scp."""
import argparse
import ast
import datetime
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import time
import urllib.request

STAGE = Path(__file__).resolve().parent
AGENT = Path('/usr/local/lib/blog-server-logs/agent.py')
UNIT = Path('/etc/systemd/system/blog-server-log-agent.service')
CONFIG = Path('/root/nginx-full/nginx.conf')
SERVICE = 'blog-server-log-agent.service'
BEGIN = '        # BEGIN BLOG SERVER LOGS\n'
END = '        # END BLOG SERVER LOGS\n'
LOCATION = BEGIN + '''        location ^~ /api/admin/server-logs/ {
            proxy_pass http://172.20.0.1:9126;
            proxy_set_header Authorization $http_authorization;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
            proxy_connect_timeout 3s;
            proxy_read_timeout 10s;
            proxy_cache off;
            add_header Cache-Control "no-store, private" always;
            add_header X-Content-Type-Options nosniff always;
            limit_except GET { deny all; }
        }
''' + END


def run(*args, check=True):
    return subprocess.run(args, check=check, stdout=subprocess.PIPE, stderr=subprocess.PIPE)


def config_with_location(text):
    if BEGIN in text or END in text:
        if text.count(BEGIN) != 1 or text.count(END) != 1:
            raise RuntimeError('nginx log markers are inconsistent')
        start, end = text.index(BEGIN), text.index(END) + len(END)
        if start >= end:
            raise RuntimeError('nginx log marker order invalid')
        return text[:start] + LOCATION + text[end:]
    anchor = '        location /api/admin/ {'
    if text.count(anchor) != 1:
        raise RuntimeError('Expected exactly one existing blog admin nginx location')
    return text.replace(anchor, LOCATION + '\n' + anchor, 1)


def atomic_write(path, content, mode):
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(dir=path.parent, delete=False) as stream:
        temporary = Path(stream.name)
        stream.write(content)
    try:
        temporary.chmod(mode)
        os.replace(temporary, path)
    finally:
        temporary.unlink(missing_ok=True)


def healthy():
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    for _ in range(20):
        try:
            with opener.open('http://172.20.0.1:9126/health', timeout=1) as response:
                if response.status == 200 and response.read(128) == b'{"status": "ok"}':
                    return
        except OSError:
            time.sleep(0.25)
    raise RuntimeError('Log service health check failed')


def main(check_only=False):
    agent = (STAGE / 'agent.py').read_bytes()
    unit = (STAGE / UNIT.name).read_bytes()
    ast.parse(agent)
    original = CONFIG.read_text()
    revised = config_with_location(original).encode()
    targets = {AGENT: (agent, 0o644), UNIT: (unit, 0o644), CONFIG: (revised, CONFIG.stat().st_mode & 0o777)}
    changed = {path: data for path, data in targets.items() if not path.exists() or path.read_bytes() != data[0]}
    run('docker', 'exec', 'nginx', 'nginx', '-t')
    if check_only:
        print('Validated source and nginx location; files requiring update:', len(changed))
        return
    if not changed:
        run('systemctl', 'start', SERVICE)
        healthy()
        print('Log service and nginx configuration already current')
        return
    backup = STAGE / 'backups' / datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
    backup.mkdir(parents=True, mode=0o700)
    previous = {}
    was_active = run('systemctl', 'is-active', '--quiet', SERVICE, check=False).returncode == 0
    was_enabled = run('systemctl', 'is-enabled', '--quiet', SERVICE, check=False).returncode == 0
    for index, path in enumerate(changed):
        saved = backup / str(index)
        previous[path] = (saved, path.stat().st_mode & 0o777) if path.exists() else None
        if path.exists():
            shutil.copy2(path, saved)
    atomic_write(backup / 'manifest.json', json.dumps({
        'files': {str(path): {'backup': str(saved[0]), 'mode': saved[1]} if saved else None
                  for path, saved in previous.items()},
        'wasActive': was_active, 'wasEnabled': was_enabled,
    }, indent=2).encode(), 0o600)
    try:
        for path, (content, mode) in changed.items():
            atomic_write(path, content, mode)
        run('docker', 'exec', 'nginx', 'nginx', '-t')
        run('systemctl', 'daemon-reload')
        if AGENT in changed or UNIT in changed or not was_active:
            run('systemctl', 'restart', SERVICE)
        healthy()
        run('docker', 'exec', 'nginx', 'nginx', '-s', 'reload')
        run('systemctl', 'enable', SERVICE)
    except Exception:
        # Restore exact files before reloading; never touch backend, logs or OSS.
        for path, saved in previous.items():
            if saved:
                atomic_write(path, saved[0].read_bytes(), saved[1])
            else:
                path.unlink(missing_ok=True)
        if not was_enabled:
            run('systemctl', 'disable', SERVICE, check=False)
        run('systemctl', 'daemon-reload', check=False)
        run('systemctl', 'restart' if was_active else 'stop', SERVICE, check=False)
        run('docker', 'exec', 'nginx', 'nginx', '-t', check=False)
        run('docker', 'exec', 'nginx', 'nginx', '-s', 'reload', check=False)
        raise RuntimeError('Deployment failed; original files restored. Backup: ' + str(backup)) from None
    print('Read-only log service deployed. Recoverable backup:', backup)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    main(parser.parse_args().check)

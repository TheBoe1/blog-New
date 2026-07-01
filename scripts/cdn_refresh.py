#!/usr/bin/env python3
"""调用阿里云 CDN RefreshObjectCaches API 刷新指定 URL。

实现阿里云 RPC API V1 签名：每个参数值先 RFC3986 编码，按键字典序
拼成待签名串，整体再编码后做 HMAC-SHA1。复用 OSS 的 AccessKey。
"""
import urllib.parse
import hmac
import hashlib
import base64
import time
import random
import os
import sys
import urllib.request
import urllib.error
import json


def enc(s: str) -> str:
    return urllib.parse.quote(str(s), safe="")


def main() -> int:
    ak = os.environ.get("OSS_KEY_ID", "")
    sk = os.environ.get("OSS_KEY_SECRET", "")
    url = os.environ.get("CDN_URL", "https://lianlab.top/index.html")

    if not ak or not sk:
        print("Skip CDN refresh: AccessKey not configured", file=sys.stderr)
        return 0

    ts = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    nonce = f"{random.randrange(16**15):015x}{int(time.time())}"

    params = {
        "AccessKeyId": ak,
        "Action": "RefreshObjectCaches",
        "Format": "JSON",
        "ObjectPath": url,
        "ObjectType": "File",
        "SignatureMethod": "HMAC-SHA1",
        "SignatureNonce": nonce,
        "SignatureVersion": "1.0",
        "Timestamp": ts,
        "Version": "2018-05-10",
    }
    sorted_str = "&".join(f"{k}={enc(v)}" for k, v in sorted(params.items()))
    string_to_sign = "GET&%2F&" + enc(sorted_str)
    sig = base64.b64encode(
        hmac.new((sk + "&").encode(), string_to_sign.encode(), hashlib.sha1).digest()
    ).decode()

    query = sorted_str + "&Signature=" + enc(sig)
    signed_url = "https://cdn.aliyuncs.com/?" + query

    print(f"Calling CDN RefreshObjectCaches for {url} ...", file=sys.stderr)
    try:
        with urllib.request.urlopen(signed_url, timeout=30) as resp:
            body = resp.read().decode()
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"HTTP {e.code} error response:", file=sys.stderr)
    print(body)

    data = json.loads(body)
    if "RefreshTaskId" in data:
        print("CDN refresh submitted OK", file=sys.stderr)
        return 0
    print(f"CDN refresh failed: {data.get('Code')} {data.get('Message')}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())

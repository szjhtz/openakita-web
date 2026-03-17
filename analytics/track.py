# -*- coding: utf-8 -*-
"""
OpenAkita Analytics - Track Function
Alibaba Cloud FC 3.0 - Web Function (Custom Runtime Python)

Function type: Web Function
Runtime:       Python 3.10 (Custom Runtime)
Listen port:   9000
Endpoint:      POST /track
Auth:          None (public)

Environment Variables:
  OSS_ENDPOINT  - e.g. "https://oss-cn-hangzhou.aliyuncs.com"
  OSS_BUCKET    - e.g. "openakita-dist"
  OSS_AK        - AccessKey ID
  OSS_SK        - AccessKey Secret
  IP_SALT       - Random string for IP hashing (keep secret)

Dependencies:
  pip install flask oss2
"""

import hashlib
import json
import os
import re
import uuid
from datetime import datetime, timezone

import oss2
from flask import Flask, request, jsonify

app = Flask(__name__)

OSS_ENDPOINT = os.environ.get("OSS_ENDPOINT", "")
OSS_BUCKET = os.environ.get("OSS_BUCKET", "")
OSS_AK = os.environ.get("OSS_AK", "")
OSS_SK = os.environ.get("OSS_SK", "")
IP_SALT = os.environ.get("IP_SALT", "openakita-default-salt-change-me")

VALID_EVENTS = {"pv", "dl", "scroll", "leave", "out", "lang", "tab", "plat"}
MAX_BODY = 2048

_bucket = None


def get_bucket():
    global _bucket
    if _bucket is None:
        auth = oss2.Auth(OSS_AK, OSS_SK)
        _bucket = oss2.Bucket(auth, OSS_ENDPOINT, OSS_BUCKET)
    return _bucket


def hash_ip(ip):
    # return hashlib.sha256((IP_SALT + ip).encode()).hexdigest()[:16]
    return ip


def parse_ua(ua):
    lo = ua.lower()
    os_name = (
        "Windows" if "windows" in lo else
        "macOS" if "macintosh" in lo or "mac os" in lo else
        "Android" if "android" in lo else
        "iOS" if "iphone" in lo or "ipad" in lo else
        "Linux" if "linux" in lo else "Other"
    )
    browser = (
        "Edge" if "edg" in lo else
        "Chrome" if "chrome" in lo else
        "Firefox" if "firefox" in lo else
        "Safari" if "safari" in lo else "Other"
    )
    device = "mobile" if os_name in ("Android", "iOS") or "mobile" in lo else "desktop"
    return {"os": os_name, "browser": browser, "device": device}


@app.after_request
def add_cors(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return response


@app.route("/track", methods=["POST", "OPTIONS"])
def track():
    if request.method == "OPTIONS":
        return "", 204

    raw = request.get_data(as_text=True)
    if len(raw) > MAX_BODY:
        return jsonify(error="too_large"), 400

    try:
        data = json.loads(raw)
    except Exception:
        return jsonify(error="invalid_json"), 400

    event_type = data.get("e", "")
    if event_type not in VALID_EVENTS:
        return jsonify(error="invalid_event"), 400

    page = (data.get("p") or "/")[:200]
    if not re.match(r"^/[\w\-/]*$", page):
        page = "/"

    ip = request.headers.get("X-Forwarded-For", request.remote_addr or "")
    if "," in ip:
        ip = ip.split(",")[0].strip()

    ua = request.headers.get("User-Agent", "")

    record = {
        "e": event_type,
        "p": page,
        "r": (data.get("r") or "")[:500],
        "l": (data.get("l") or "")[:20],
        "s": (data.get("s") or "")[:20],
        "sid": (data.get("sid") or "")[:30],
        "rv": bool(data.get("rv")),
        "ep": (data.get("ep") or page)[:200],
        "utm": data.get("utm") if isinstance(data.get("utm"), dict) else None,
        "d": data.get("d") if isinstance(data.get("d"), dict) else None,
        "ip": hash_ip(ip),
        "ua": parse_ua(ua),
        "ts": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }

    now = datetime.now(timezone.utc)
    key = "analytics/events/{}/{}/{}/{}_{}.json".format(
        now.strftime("%Y"), now.strftime("%m"), now.strftime("%d"),
        int(now.timestamp() * 1000), uuid.uuid4().hex[:8],
    )

    try:
        get_bucket().put_object(key, json.dumps(record, ensure_ascii=False).encode("utf-8"))
    except Exception:
        return jsonify(error="storage_failed"), 500

    return jsonify(ok=True), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=9000)

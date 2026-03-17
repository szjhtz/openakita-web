"""
OpenAkita Analytics — Aggregate Function
阿里云函数计算 FC 3.0 — 事件函数（内置运行时 Python）

读取 OSS 中的原始事件文件，聚合生成统计 JSON。

────────────────────────────────
函数类型:    事件函数
运行时:      Python 3.10 (内置运行时)
处理程序:    aggregate.handler
触发器:      定时触发器（Cron: 0 0 * * * * 每小时一次）
认证方式:    不适用（内部触发）
────────────────────────────────

环境变量:
  OSS_ENDPOINT  — e.g. "https://oss-cn-hangzhou.aliyuncs.com"
  OSS_BUCKET    — e.g. "openakita-dist"
  OSS_AK        — AccessKey ID
  OSS_SK        — AccessKey Secret
  STATS_DAYS    — 聚合天数，默认 90
"""

import json
import os
from collections import defaultdict
from datetime import datetime, timedelta, timezone

import oss2

OSS_ENDPOINT = os.environ.get("OSS_ENDPOINT", "")
OSS_BUCKET = os.environ.get("OSS_BUCKET", "")
OSS_AK = os.environ.get("OSS_AK", "")
OSS_SK = os.environ.get("OSS_SK", "")
STATS_DAYS = int(os.environ.get("STATS_DAYS", "90"))

_bucket = None


def get_bucket():
    global _bucket
    if _bucket is None:
        auth = oss2.Auth(OSS_AK, OSS_SK)
        _bucket = oss2.Bucket(auth, OSS_ENDPOINT, OSS_BUCKET)
    return _bucket


def list_event_files(bucket, date_str):
    parts = date_str.split("-")
    prefix = "analytics/events/{}/{}/{}/".format(parts[0], parts[1], parts[2])
    files = []
    for obj in oss2.ObjectIterator(bucket, prefix=prefix):
        if obj.key.endswith(".json"):
            files.append(obj.key)
    return files


def read_event(bucket, key):
    try:
        return json.loads(bucket.get_object(key).read().decode("utf-8"))
    except Exception:
        return None


def aggregate_events(events):
    total_pv = 0
    ip_set = set()
    session_set = set()
    pages = defaultdict(lambda: {"pv": 0, "ips": set()})
    downloads = {
        "total": 0,
        "by_version": defaultdict(lambda: defaultdict(int)),
        "by_platform": defaultdict(int),
        "by_channel": defaultdict(int),
        "by_file": defaultdict(int),
    }
    daily = defaultdict(lambda: {"pv": 0, "uv": set(), "dl": 0})
    referrers = defaultdict(int)
    languages = defaultdict(int)
    devices = {"desktop": 0, "mobile": 0, "tablet": 0}
    os_stats = defaultdict(int)
    browsers = defaultdict(int)
    scroll_depths = defaultdict(int)
    durations = []
    outbound = defaultdict(int)
    lang_switches = defaultdict(int)
    entry_pages = defaultdict(int)
    utm_sources = defaultdict(int)

    for ev in events:
        if not ev or not isinstance(ev, dict):
            continue

        et = ev.get("e", "")
        ip_hash = ev.get("ip", "")
        sid = ev.get("sid", "")
        page = ev.get("p", "/")
        ts = ev.get("ts", "")
        day = ts[:10] if ts else ""
        ua_info = ev.get("ua") or {}

        if et == "pv":
            total_pv += 1
            ip_set.add(ip_hash)
            session_set.add(sid)
            pages[page]["pv"] += 1
            pages[page]["ips"].add(ip_hash)

            if day:
                daily[day]["pv"] += 1
                daily[day]["uv"].add(ip_hash)

            ref = ev.get("r", "")
            if ref:
                try:
                    from urllib.parse import urlparse
                    referrers[urlparse(ref).hostname or ref] += 1
                except Exception:
                    referrers[ref[:60]] += 1

            languages[ev.get("l", "unknown")[:10]] += 1
            device = ua_info.get("device", "desktop")
            if device in devices:
                devices[device] += 1
            os_stats[ua_info.get("os", "Other")] += 1
            browsers[ua_info.get("browser", "Other")] += 1
            entry_pages[ev.get("ep", page)] += 1

            utm = ev.get("utm")
            if utm and isinstance(utm, dict) and utm.get("utm_source"):
                utm_sources[utm["utm_source"]] += 1

        elif et == "dl":
            d = ev.get("d") or {}
            ver = d.get("version", "unknown")
            plat = d.get("platform", "unknown")
            ch = d.get("channel", "unknown")
            fname = d.get("filename", "")

            downloads["total"] += 1
            downloads["by_version"][ver]["total"] = downloads["by_version"][ver].get("total", 0) + 1
            downloads["by_version"][ver][plat] = downloads["by_version"][ver].get(plat, 0) + 1
            downloads["by_platform"][plat] += 1
            downloads["by_channel"][ch] += 1
            if fname:
                downloads["by_file"][fname] += 1
            if day:
                daily[day]["dl"] += 1

        elif et == "scroll":
            d = ev.get("d") or {}
            scroll_depths[str(d.get("depth", 0))] += 1

        elif et == "leave":
            d = ev.get("d") or {}
            dur = d.get("dur", 0)
            if 0 < dur < 3600:
                durations.append(dur)

        elif et == "out":
            d = ev.get("d") or {}
            url = d.get("url", "")[:100]
            if url:
                outbound[url] += 1

        elif et == "lang":
            d = ev.get("d") or {}
            if d.get("to"):
                lang_switches[d["to"]] += 1

    avg_dur = round(sum(durations) / len(durations), 1) if durations else 0
    median_dur = sorted(durations)[len(durations) // 2] if durations else 0

    page_stats = {}
    for p, info in sorted(pages.items(), key=lambda x: -x[1]["pv"]):
        page_stats[p] = {"pv": info["pv"], "uv": len(info["ips"])}

    daily_sorted = {}
    for d in sorted(daily.keys()):
        daily_sorted[d] = {"pv": daily[d]["pv"], "uv": len(daily[d]["uv"]), "dl": daily[d]["dl"]}

    def top_n(d, n=20):
        return dict(sorted(d.items(), key=lambda x: -x[1])[:n])

    return {
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "period_days": STATS_DAYS,
        "overview": {
            "total_pv": total_pv,
            "total_uv": len(ip_set),
            "total_sessions": len(session_set),
            "total_downloads": downloads["total"],
            "avg_session_duration": avg_dur,
            "median_session_duration": median_dur,
        },
        "downloads": {
            "total": downloads["total"],
            "by_version": dict(downloads["by_version"]),
            "by_platform": dict(downloads["by_platform"]),
            "by_channel": dict(downloads["by_channel"]),
            "top_files": top_n(downloads["by_file"]),
        },
        "pages": page_stats,
        "daily": daily_sorted,
        "referrers": top_n(dict(referrers)),
        "languages": top_n(dict(languages)),
        "devices": devices,
        "os": top_n(dict(os_stats)),
        "browsers": top_n(dict(browsers)),
        "scroll_depths": dict(scroll_depths),
        "session_duration": {"avg": avg_dur, "median": median_dur, "samples": len(durations)},
        "outbound_clicks": top_n(dict(outbound)),
        "lang_switches": dict(lang_switches),
        "entry_pages": top_n(dict(entry_pages)),
        "utm_sources": top_n(dict(utm_sources)),
    }


def handler(event, context):
    """事件函数入口，由定时触发器调用。"""

    bucket = get_bucket()
    today = datetime.now(timezone.utc)
    all_events = []

    for i in range(STATS_DAYS):
        day = today - timedelta(days=i)
        day_str = day.strftime("%Y-%m-%d")
        for f in list_event_files(bucket, day_str):
            ev = read_event(bucket, f)
            if ev:
                all_events.append(ev)

    stats = aggregate_events(all_events)
    stats_json = json.dumps(stats, ensure_ascii=False, indent=2)

    bucket.put_object("analytics/stats/latest.json", stats_json.encode("utf-8"))
    bucket.put_object(
        "analytics/stats/daily/{}.json".format(today.strftime("%Y-%m-%d")),
        stats_json.encode("utf-8"),
    )

    return "OK: aggregated {} events".format(len(all_events))

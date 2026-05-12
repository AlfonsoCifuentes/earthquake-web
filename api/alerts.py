"""
/api/alerts.py
Vercel Python Serverless Function
Fetches USGS significant earthquake feed (last 7 days + 24h alerts).
"""
from http.server import BaseHTTPRequestHandler
import json
import urllib.request
from urllib.parse import urlparse, parse_qs
from datetime import datetime, timezone

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
}

FEEDS = {
    "significant_week": "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_week.geojson",
    "m4.5_day": "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson",
    "m2.5_hour": "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_hour.geojson",
}

ALERT_COLORS = {
    "critical": "#ff3b30",  # M7+
    "high": "#ff9500",      # M6+
    "moderate": "#ffd60a",  # M5+
    "low": "#30d158",       # <M5
}


def _alert_level(mag: float) -> str:
    if mag >= 7.0:
        return "critical"
    elif mag >= 6.0:
        return "high"
    elif mag >= 5.0:
        return "moderate"
    return "low"


def _fetch_feed(url: str):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "SeismicAtlas/1.0"})
        with urllib.request.urlopen(req, timeout=8) as resp:
            return json.loads(resp.read().decode())
    except Exception:
        return None


def _parse_features(data: dict, limit: int = 50):
    rows = []
    now_ms = datetime.now(tz=timezone.utc).timestamp() * 1000
    for f in (data.get("features", []) if data else [])[:limit]:
        p = f.get("properties", {})
        g = f.get("geometry", {})
        mag = p.get("mag") or 0.0
        ts = p.get("time")
        time_str = (
            datetime.fromtimestamp(ts / 1000, tz=timezone.utc).isoformat()
            if ts else None
        )
        age_hours = ((now_ms - ts) / 3_600_000) if ts else 9999
        coords = g.get("coordinates", [None, None, None])
        rows.append(
            {
                "id": f.get("id", ""),
                "time": time_str,
                "age_hours": round(age_hours, 1),
                "mag": mag,
                "place": p.get("place", ""),
                "depth": coords[2],
                "latitude": coords[1],
                "longitude": coords[0],
                "alert": _alert_level(mag),
                "alert_color": ALERT_COLORS[_alert_level(mag)],
                "url": p.get("url", ""),
                "felt": p.get("felt"),
                "cdi": p.get("cdi"),
                "mmi": p.get("mmi"),
                "tsunami": p.get("tsunami", 0),
            }
        )
    return rows


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        for k, v in CORS.items():
            self.send_header(k, v)
        self.end_headers()

    def do_GET(self):
        qs = parse_qs(urlparse(self.path).query)
        feed_type = qs.get("feed", ["significant_week"])[0]
        limit = int(qs.get("limit", ["50"])[0])

        url = FEEDS.get(feed_type, FEEDS["significant_week"])
        data = _fetch_feed(url)
        rows = _parse_features(data, limit)

        # Summary
        critical = [r for r in rows if r["alert"] == "critical"]
        high = [r for r in rows if r["alert"] == "high"]

        payload = {
            "feed": feed_type,
            "count": len(rows),
            "summary": {
                "critical": len(critical),
                "high": len(high),
                "moderate": len([r for r in rows if r["alert"] == "moderate"]),
                "low": len([r for r in rows if r["alert"] == "low"]),
            },
            "data": rows,
        }
        body = json.dumps(payload).encode()

        self.send_response(200)
        for k, v in CORS.items():
            self.send_header(k, v)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass

"""
api/alerts.py
Vercel Python Serverless Function
Fetches USGS official earthquake feeds (significant_week, m4.5_day, m2.5_hour).
Explains that alert levels represent magnitude brackets, not official PAGER loss levels.
"""
from http.server import BaseHTTPRequestHandler
import json
import urllib.request
from urllib.parse import urlparse, parse_qs
from datetime import datetime, timezone
import os
import sys

_API_DIR = os.path.dirname(os.path.abspath(__file__))
if _API_DIR not in sys.path:
    sys.path.insert(0, _API_DIR)

from validation import parse_bounded_int, send_json_response

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
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
        req = urllib.request.Request(url, headers={"User-Agent": "SeismicAtlas/1.0 (Alerts)"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception:
        return None


def _parse_features(data: dict, limit: int = 50):
    rows = []
    now_ms = datetime.now(tz=timezone.utc).timestamp() * 1000
    for f in (data.get("features", []) if data else [])[:limit]:
        p = f.get("properties", {})
        g = f.get("geometry", {})
        try:
            mag = float(p.get("mag") or 0.0)
        except (ValueError, TypeError):
            mag = 0.0

        ts = p.get("time")
        time_str = (
            datetime.fromtimestamp(ts / 1000, tz=timezone.utc).isoformat()
            if ts else None
        )
        age_hours = ((now_ms - ts) / 3_600_000) if ts else 9999.0
        coords = g.get("coordinates", [None, None, None])
        lon = coords[0] if len(coords) > 0 else None
        lat = coords[1] if len(coords) > 1 else None
        depth = coords[2] if len(coords) > 2 else None

        rows.append(
            {
                "id": f.get("id", ""),
                "time": time_str,
                "age_hours": round(age_hours, 1),
                "mag": round(mag, 2),
                "place": p.get("place", "") or "Unknown location",
                "depth": round(depth, 1) if depth is not None else None,
                "latitude": round(lat, 4) if lat is not None else None,
                "longitude": round(lon, 4) if lon is not None else None,
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
        if feed_type not in FEEDS:
            send_json_response(
                self,
                400,
                {"error": f"Unknown feed '{feed_type}'. Allowed: {list(FEEDS.keys())}"},
                CORS,
            )
            return

        try:
            limit = parse_bounded_int(qs.get("limit", [None])[0], default=50, minimum=1, maximum=500)
        except ValueError as err:
            send_json_response(self, 400, {"error": str(err)}, CORS)
            return

        url = FEEDS[feed_type]
        data = _fetch_feed(url)
        rows = _parse_features(data, limit)

        critical = [r for r in rows if r["alert"] == "critical"]
        high = [r for r in rows if r["alert"] == "high"]
        moderate = [r for r in rows if r["alert"] == "moderate"]
        low = [r for r in rows if r["alert"] == "low"]

        payload = {
            "feed": feed_type,
            "source": "usgs",
            "count": len(rows),
            "disclaimer": "Alert levels (Critical, High, Moderate, Low) are magnitude-based brackets (M>=7, M>=6, M>=5, <M5), not official PAGER loss estimates. Tsunami flag indicates ocean event evaluation by warning centers.",
            "summary": {
                "critical": len(critical),
                "high": len(high),
                "moderate": len(moderate),
                "low": len(low),
            },
            "data": rows,
        }
        send_json_response(self, 200, payload, CORS)

    def log_message(self, *args):
        pass

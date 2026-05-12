"""
/api/realtime.py
Vercel Python Serverless Function
Returns recent earthquake data from USGS + local CSV fallback.
"""
from http.server import BaseHTTPRequestHandler
import json
import os
import csv
import io
import urllib.request
from datetime import datetime, timezone

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
}

USGS_URL = (
    "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson"
)


def _cors_headers(handler):
    for k, v in CORS.items():
        handler.send_header(k, v)


def _parse_geojson(data: dict, min_mag: float, max_mag: float, limit: int):
    features = data.get("features", [])
    rows = []
    for f in features:
        p = f.get("properties", {})
        g = f.get("geometry", {})
        mag = p.get("mag")
        if mag is None:
            continue
        if not (min_mag <= mag <= max_mag):
            continue
        coords = g.get("coordinates", [None, None, None])
        lon, lat, depth = coords[0], coords[1], coords[2]
        ts = p.get("time")
        time_str = (
            datetime.fromtimestamp(ts / 1000, tz=timezone.utc).isoformat()
            if ts
            else None
        )
        rows.append(
            {
                "time": time_str,
                "mag": mag,
                "depth": round(depth, 1) if depth is not None else None,
                "latitude": round(lat, 4) if lat is not None else None,
                "longitude": round(lon, 4) if lon is not None else None,
                "place": p.get("place", ""),
                "type": p.get("type", "earthquake"),
                "status": p.get("status", ""),
                "id": f.get("id", ""),
                "url": p.get("url", ""),
            }
        )
    rows.sort(key=lambda r: r["time"] or "", reverse=True)
    return rows[:limit]


def _csv_fallback(min_mag: float, max_mag: float, limit: int):
    """Load local all_month.csv as a fallback."""
    here = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(here, "..", "data", "all_month.csv")
    rows = []
    try:
        with open(csv_path, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    mag = float(row.get("mag", "") or 0)
                except ValueError:
                    continue
                if not (min_mag <= mag <= max_mag):
                    continue
                rows.append(
                    {
                        "time": row.get("time", ""),
                        "mag": mag,
                        "depth": float(row.get("depth", 0) or 0),
                        "latitude": float(row.get("latitude", 0) or 0),
                        "longitude": float(row.get("longitude", 0) or 0),
                        "place": row.get("place", ""),
                        "type": row.get("type", "earthquake"),
                        "status": row.get("status", ""),
                        "id": row.get("id", ""),
                        "url": "",
                    }
                )
    except FileNotFoundError:
        pass
    rows.sort(key=lambda r: r["time"] or "", reverse=True)
    return rows[:limit]


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        _cors_headers(self)
        self.end_headers()

    def do_GET(self):
        # Parse query params
        from urllib.parse import urlparse, parse_qs
        qs = parse_qs(urlparse(self.path).query)
        min_mag = float(qs.get("min_mag", ["0"])[0])
        max_mag = float(qs.get("max_mag", ["10"])[0])
        limit = int(qs.get("limit", ["2000"])[0])

        rows = []
        source = "usgs"
        try:
            req = urllib.request.Request(USGS_URL, headers={"User-Agent": "SeismicAtlas/1.0"})
            with urllib.request.urlopen(req, timeout=8) as resp:
                data = json.loads(resp.read().decode())
            rows = _parse_geojson(data, min_mag, max_mag, limit)
        except Exception:
            rows = _csv_fallback(min_mag, max_mag, limit)
            source = "local_csv"

        payload = {
            "count": len(rows),
            "source": source,
            "data": rows,
        }
        body = json.dumps(payload).encode()
        self.send_response(200)
        _cors_headers(self)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass

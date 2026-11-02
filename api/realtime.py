"""
api/realtime.py
Vercel Python Serverless Function
Returns recent earthquake data from USGS rolling month feed with local fallback.
Provides traceability metadata (source, fetched_at, stale, coverage, warning).
"""
from http.server import BaseHTTPRequestHandler
import json
import os
import csv
import math
import urllib.request
from urllib.parse import urlparse, parse_qs
from datetime import datetime, timezone
import os
import sys

_API_DIR = os.path.dirname(os.path.abspath(__file__))
if _API_DIR not in sys.path:
    sys.path.insert(0, _API_DIR)

from validation import parse_bounded_float, parse_bounded_int, send_json_response

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

USGS_URL = (
    "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson"
)


def _parse_geojson(data: dict, min_mag: float, max_mag: float, limit: int):
    features = data.get("features", [])
    rows = []
    for f in features:
        p = f.get("properties", {})
        g = f.get("geometry", {})
        mag = p.get("mag")
        if mag is None:
            continue
        try:
            mag_f = float(mag)
        except (ValueError, TypeError):
            continue
        if not (min_mag <= mag_f <= max_mag):
            continue

        coords = g.get("coordinates", [None, None, None])
        if len(coords) < 3:
            continue
        lon, lat, depth = coords[0], coords[1], coords[2]
        if lat is None or lon is None or depth is None:
            continue
        try:
            lat_f = float(lat)
            lon_f = float(lon)
            depth_f = float(depth)
        except (ValueError, TypeError):
            continue

        if not (math.isfinite(lat_f) and math.isfinite(lon_f) and math.isfinite(depth_f)):
            continue
        if not (-90.0 <= lat_f <= 90.0 and -180.0 <= lon_f <= 180.0):
            continue

        ts = p.get("time")
        time_str = (
            datetime.fromtimestamp(ts / 1000, tz=timezone.utc).isoformat()
            if ts
            else None
        )
        rows.append(
            {
                "time": time_str,
                "mag": round(mag_f, 2),
                "depth": round(depth_f, 1),
                "latitude": round(lat_f, 4),
                "longitude": round(lon_f, 4),
                "place": p.get("place", "") or "Unknown",
                "type": p.get("type", "earthquake"),
                "status": p.get("status", ""),
                "id": f.get("id", ""),
                "url": p.get("url", ""),
            }
        )
    rows.sort(key=lambda r: r["time"] or "", reverse=True)
    return rows[:limit]


def _csv_fallback(min_mag: float, max_mag: float, limit: int):
    """Load local all_month.csv as a degraded fallback."""
    here = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(here, "..", "data", "all_month.csv")
    rows = []
    try:
        with open(csv_path, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    mag = float(row.get("mag", "") or 0)
                    depth = float(row.get("depth", 0) or 0)
                    lat = float(row.get("latitude", 0) or 0)
                    lon = float(row.get("longitude", 0) or 0)
                except (ValueError, TypeError):
                    continue
                if not (min_mag <= mag <= max_mag):
                    continue
                if not (-90.0 <= lat <= 90.0 and -180.0 <= lon <= 180.0):
                    continue
                rows.append(
                    {
                        "time": row.get("time", ""),
                        "mag": round(mag, 2),
                        "depth": round(depth, 1),
                        "latitude": round(lat, 4),
                        "longitude": round(lon, 4),
                        "place": row.get("place", "") or "Unknown",
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
        for k, v in CORS.items():
            self.send_header(k, v)
        self.end_headers()

    def do_GET(self):
        qs = parse_qs(urlparse(self.path).query)
        try:
            min_mag = parse_bounded_float(qs.get("min_mag", [None])[0], default=0.0, minimum=0.0, maximum=10.0)
            max_mag = parse_bounded_float(qs.get("max_mag", [None])[0], default=10.0, minimum=0.0, maximum=10.0)
            if min_mag > max_mag:
                raise ValueError(f"min_mag ({min_mag}) cannot exceed max_mag ({max_mag})")
            limit = parse_bounded_int(qs.get("limit", [None])[0], default=2000, minimum=1, maximum=10000)
        except ValueError as err:
            send_json_response(self, 400, {"error": str(err)}, CORS)
            return

        now_utc = datetime.now(tz=timezone.utc).isoformat()
        rows = []
        source = "usgs"
        stale = False
        warning = None

        try:
            req = urllib.request.Request(
                USGS_URL,
                headers={"User-Agent": "SeismicAtlas/1.0 (EarthquakeWeb)"}
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            rows = _parse_geojson(data, min_mag, max_mag, limit)
        except Exception as exc:
            rows = _csv_fallback(min_mag, max_mag, limit)
            source = "local_csv_fallback"
            stale = True
            warning = f"Live USGS feed temporarily unreachable ({exc}); displaying cached local fallback."

        # Compute coverage dates
        times = [r["time"] for r in rows if r.get("time")]
        start_cov = min(times) if times else None
        end_cov = max(times) if times else None

        payload = {
            "count": len(rows),
            "source": source,
            "fetched_at": now_utc,
            "stale": stale,
            "warning": warning,
            "coverage": {
                "kind": "rolling_month" if not stale else "local_snapshot",
                "start": start_cov,
                "end": end_cov,
                "minimum_magnitude": min_mag,
                "maximum_magnitude": max_mag,
            },
            "data": rows,
        }
        send_json_response(self, 200, payload, CORS)

    def log_message(self, *args):
        pass

"""
api/historical.py
Vercel Python Serverless Function
Serves the 2005-2025 historical earthquake dataset (M>=5.5).
Supports filtering by magnitude, depth, date, and multiple regions.
"""
from http.server import BaseHTTPRequestHandler
import json
import os
import csv
import math
from urllib.parse import urlparse, parse_qs
from statistics import mean, stdev
import os
import sys

_API_DIR = os.path.dirname(os.path.abspath(__file__))
if _API_DIR not in sys.path:
    sys.path.insert(0, _API_DIR)

from validation import (
    parse_bounded_float,
    parse_bounded_int,
    parse_iso_date,
    send_json_response,
)

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

HERE = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(HERE, "..", "data", "2005-2025_mas_de_5_5_E_R.csv")

TECTONIC_REGIONS = {
    "Ring of Fire": [
        "japan", "indonesia", "philippines", "chile", "peru", "mexico",
        "alaska", "tonga", "vanuatu", "papua new guinea", "new zealand",
        "fiji", "solomon", "kermadec", "marianas", "ryukyu",
    ],
    "Alpine-Himalayan Belt": [
        "turkey", "greece", "italy", "iran", "pakistan", "india",
        "nepal", "afghanistan", "tajikistan", "uzbekistan", "georgia",
        "caucasus", "hindu kush",
    ],
    "Mid-Atlantic Ridge": [
        "atlantic", "mid-atlantic", "azores", "iceland", "south atlantic",
    ],
}


def classify_region(place: str) -> str:
    pl = (place or "").lower()
    for region, keywords in TECTONIC_REGIONS.items():
        if any(k in pl for k in keywords):
            return region
    return "Other Regions"


def _load_csv(
    min_mag: float = 5.5,
    max_mag: float = 10.0,
    min_depth: float = 0.0,
    max_depth: float = 700.0,
    start_date: str | None = None,
    end_date: str | None = None,
    regions: list[str] | str | None = None,
    limit: int = 5000,
):
    # Normalize requested regions to a set
    requested_regions: set[str] = set()
    if isinstance(regions, str):
        if regions and regions != "All":
            requested_regions = {regions}
    elif isinstance(regions, (list, tuple)):
        requested_regions = {r for r in regions if r and r != "All"}

    rows = []
    try:
        with open(CSV_PATH, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    mag = float(row.get("mag", "") or 0)
                    depth = float(row.get("depth", "") or 0)
                    lat = float(row.get("latitude", "") or 0)
                    lon = float(row.get("longitude", "") or 0)
                except (ValueError, TypeError):
                    continue

                if not (math.isfinite(mag) and math.isfinite(depth) and math.isfinite(lat) and math.isfinite(lon)):
                    continue
                if not (min_mag <= mag <= max_mag):
                    continue
                if not (min_depth <= depth <= max_depth):
                    continue

                time_str = row.get("time", "")
                if start_date and time_str and time_str[:10] < start_date:
                    continue
                if end_date and time_str and time_str[:10] > end_date:
                    continue

                place = row.get("place", "")
                tec_region = classify_region(place)
                if requested_regions and tec_region not in requested_regions:
                    continue

                rows.append(
                    {
                        "time": time_str,
                        "mag": round(mag, 2),
                        "depth": round(depth, 1),
                        "latitude": round(lat, 4),
                        "longitude": round(lon, 4),
                        "place": place,
                        "type": row.get("type", "earthquake"),
                        "magType": row.get("magType", ""),
                        "id": row.get("id", ""),
                        "status": row.get("status", ""),
                        "region": tec_region,
                    }
                )
    except FileNotFoundError:
        pass

    rows.sort(key=lambda r: r["time"] or "", reverse=True)
    return rows[:limit]


def _summary_stats(rows):
    if not rows:
        return {
            "total": 0,
            "avg_mag": 0.0,
            "max_mag": 0.0,
            "avg_depth": 0.0,
            "std_mag": 0.0,
            "region_counts": {},
            "top_places": [],
            "mag_distribution": {"<6": 0, "6-6.9": 0, "7-7.9": 0, "8+": 0},
        }

    mags = [r["mag"] for r in rows]
    depths = [r["depth"] for r in rows]

    region_counts: dict = {}
    for r in rows:
        region_counts[r["region"]] = region_counts.get(r["region"], 0) + 1

    place_counts: dict = {}
    for r in rows:
        place_counts[r["place"]] = place_counts.get(r["place"], 0) + 1
    top_places = sorted(place_counts.items(), key=lambda x: -x[1])[:10]

    mag_dist: dict = {"<6": 0, "6-6.9": 0, "7-7.9": 0, "8+": 0}
    for m in mags:
        if m < 6:
            mag_dist["<6"] += 1
        elif m < 7:
            mag_dist["6-6.9"] += 1
        elif m < 8:
            mag_dist["7-7.9"] += 1
        else:
            mag_dist["8+"] += 1

    return {
        "total": len(rows),
        "avg_mag": round(mean(mags), 2),
        "max_mag": round(max(mags), 2),
        "avg_depth": round(mean(depths), 1),
        "std_mag": round(stdev(mags), 3) if len(mags) > 1 else 0.0,
        "region_counts": region_counts,
        "top_places": [{"place": p, "count": c} for p, c in top_places],
        "mag_distribution": mag_dist,
    }


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        for k, v in CORS.items():
            self.send_header(k, v)
        self.end_headers()

    def do_GET(self):
        qs = parse_qs(urlparse(self.path).query)
        try:
            min_mag = parse_bounded_float(qs.get("min_mag", [None])[0], default=5.5, minimum=0.0, maximum=10.0)
            max_mag = parse_bounded_float(qs.get("max_mag", [None])[0], default=10.0, minimum=0.0, maximum=10.0)
            if min_mag > max_mag:
                raise ValueError(f"min_mag ({min_mag}) cannot exceed max_mag ({max_mag})")

            min_depth = parse_bounded_float(qs.get("min_depth", [None])[0], default=0.0, minimum=0.0, maximum=1000.0)
            max_depth = parse_bounded_float(qs.get("max_depth", [None])[0], default=700.0, minimum=0.0, maximum=1000.0)
            if min_depth > max_depth:
                raise ValueError(f"min_depth ({min_depth}) cannot exceed max_depth ({max_depth})")

            start_date = parse_iso_date(qs.get("start_date", [None])[0])
            end_date = parse_iso_date(qs.get("end_date", [None])[0])
            if start_date and end_date and start_date > end_date:
                raise ValueError(f"start_date ({start_date}) cannot be after end_date ({end_date})")

            # Extract all region params
            regions = qs.get("region", [])
            limit = parse_bounded_int(qs.get("limit", [None])[0], default=5000, minimum=1, maximum=10000)
        except ValueError as err:
            send_json_response(self, 400, {"error": str(err)}, CORS)
            return

        rows = _load_csv(
            min_mag=min_mag,
            max_mag=max_mag,
            min_depth=min_depth,
            max_depth=max_depth,
            start_date=start_date,
            end_date=end_date,
            regions=regions,
            limit=limit,
        )
        stats = _summary_stats(rows)
        payload = {
            "stats": stats,
            "data": rows,
            "coverage": {
                "dataset": "2005-2025_mas_de_5_5_E_R.csv",
                "start": "2005-05-03",
                "end": "2025-05-08",
                "minimum_magnitude": 5.5,
            },
        }
        send_json_response(self, 200, payload, CORS)

    def log_message(self, *args):
        pass

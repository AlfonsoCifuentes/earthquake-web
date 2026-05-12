"""
/api/historical.py
Vercel Python Serverless Function
Serves the 2005-2025 historical earthquake dataset (M>5.5).
Supports filtering by magnitude, depth, date, region.
"""
from http.server import BaseHTTPRequestHandler
import json
import os
import csv
from urllib.parse import urlparse, parse_qs

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
}

HERE = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(HERE, "..", "data", "2005-2025_mas_de_5_5_E_R.csv")

TECTONIC_REGIONS = {
    "Ring of Fire": [
        "Japan", "Indonesia", "Philippines", "Chile", "Peru", "Mexico",
        "Alaska", "Tonga", "Vanuatu", "Papua New Guinea", "New Zealand",
        "Fiji", "Solomon", "Kermadec", "Marianas", "Ryukyu",
    ],
    "Alpine-Himalayan Belt": [
        "Turkey", "Greece", "Italy", "Iran", "Pakistan", "India",
        "Nepal", "Afghanistan", "Tajikistan", "Uzbekistan", "Georgia",
        "Caucasus", "Hindu Kush",
    ],
    "Mid-Atlantic Ridge": [
        "Atlantic", "Mid-Atlantic", "Azores", "Iceland", "Mid-Indian",
        "South Atlantic",
    ],
}


def classify_region(place: str) -> str:
    pl = place.lower()
    for region, keywords in TECTONIC_REGIONS.items():
        if any(k.lower() in pl for k in keywords):
            return region
    return "Other Regions"


def _load_csv(
    min_mag: float,
    max_mag: float,
    min_depth: float,
    max_depth: float,
    start_date: str,
    end_date: str,
    region: str,
    limit: int,
):
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
                except ValueError:
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
                if region and region != "All" and tec_region != region:
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
        return {}
    mags = [r["mag"] for r in rows]
    depths = [r["depth"] for r in rows]
    from statistics import mean, stdev

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
        "std_mag": round(stdev(mags), 3) if len(mags) > 1 else 0,
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
        min_mag = float(qs.get("min_mag", ["5.5"])[0])
        max_mag = float(qs.get("max_mag", ["10"])[0])
        min_depth = float(qs.get("min_depth", ["0"])[0])
        max_depth = float(qs.get("max_depth", ["700"])[0])
        start_date = qs.get("start_date", [""])[0]
        end_date = qs.get("end_date", [""])[0]
        region = qs.get("region", ["All"])[0]
        limit = int(qs.get("limit", ["5000"])[0])

        rows = _load_csv(
            min_mag, max_mag, min_depth, max_depth,
            start_date, end_date, region, limit
        )
        stats = _summary_stats(rows)
        payload = {"stats": stats, "data": rows}
        body = json.dumps(payload).encode()

        self.send_response(200)
        for k, v in CORS.items():
            self.send_header(k, v)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass

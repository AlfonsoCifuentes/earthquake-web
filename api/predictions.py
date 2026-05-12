"""
/api/predictions.py
Vercel Python Serverless Function
Poisson recurrence analysis per tectonic region (replicates Streamlit tab).
"""
from http.server import BaseHTTPRequestHandler
import json
import os
import csv
import math
from urllib.parse import urlparse, parse_qs
from datetime import datetime, timedelta, timezone

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
}

HERE = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(HERE, "..", "data", "2005-2025_mas_de_5_5_E_R.csv")

TECTONIC_REGIONS = {
    "Ring of Fire (West Pacific)": [
        "Japan", "Indonesia", "Philippines", "Papua New Guinea", "Tonga",
        "Vanuatu", "Solomon", "Kermadec", "Marianas", "Ryukyu", "Fiji",
    ],
    "Ring of Fire (East Pacific)": [
        "Chile", "Peru", "Ecuador", "Colombia", "Mexico",
        "Central America", "Alaska", "Aleutian",
    ],
    "Alpine-Himalayan Belt": [
        "Turkey", "Greece", "Iran", "Pakistan", "India", "Nepal",
        "Afghanistan", "Tajikistan", "Hindu Kush", "Caucasus",
    ],
    "Mid-Atlantic Ridge": [
        "Atlantic", "Azores", "Iceland",
    ],
    "Other Regions": [],
}


def classify(place: str) -> str:
    pl = place.lower()
    for region, keywords in TECTONIC_REGIONS.items():
        if region == "Other Regions":
            continue
        if any(k.lower() in pl for k in keywords):
            return region
    return "Other Regions"


def poisson_prob(lam: float, t: float = 1.0) -> float:
    """P(k>=1) in time window t given rate lam events/year."""
    return 1 - math.exp(-lam * t)


def _risk_color(prob: float) -> str:
    if prob >= 0.80:
        return "#ff3b30"
    elif prob >= 0.50:
        return "#ff9500"
    elif prob >= 0.20:
        return "#ffd60a"
    return "#30d158"


def _load_and_predict(min_mag: float):
    # ── Load M>min_mag events ──────────────────────────────────
    by_region: dict = {r: [] for r in TECTONIC_REGIONS}

    try:
        with open(CSV_PATH, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    mag = float(row.get("mag", "") or 0)
                except ValueError:
                    continue
                if mag < min_mag:
                    continue
                time_str = row.get("time", "")
                place = row.get("place", "")
                lat = float(row.get("latitude", 0) or 0)
                lon = float(row.get("longitude", 0) or 0)
                region = classify(place)
                by_region[region].append(
                    {"time": time_str, "mag": mag, "lat": lat, "lon": lon, "place": place}
                )
    except FileNotFoundError:
        return []

    # ── Date span: 2005-01-01 to today ────────────────────────
    start_year = 2005
    now = datetime.now(tz=timezone.utc)
    total_years = (now.year - start_year) + (now.timetuple().tm_yday / 365.25)

    results = []
    for region, events in by_region.items():
        n = len(events)
        if n == 0:
            results.append(
                {
                    "region": region,
                    "n_events": 0,
                    "events_per_year": 0,
                    "recurrence_years": None,
                    "recurrence_months": None,
                    "prob_1yr": 0,
                    "prob_5yr": 0,
                    "last_event_date": None,
                    "next_estimated": None,
                    "risk_color": "#30d158",
                    "lat": 0,
                    "lon": 0,
                }
            )
            continue

        lam = n / total_years  # events/year
        recurrence_yr = 1 / lam if lam > 0 else None
        recurrence_mo = recurrence_yr * 12 if recurrence_yr else None
        prob_1yr = poisson_prob(lam, 1.0)
        prob_5yr = poisson_prob(lam, 5.0)

        # Last event date
        events_sorted = sorted(events, key=lambda e: e["time"], reverse=True)
        last_time = events_sorted[0]["time"]
        try:
            last_dt = datetime.fromisoformat(last_time.replace("Z", "+00:00"))
            next_est = (
                last_dt + timedelta(days=recurrence_yr * 365.25)
            ).strftime("%Y-%m-%d")
        except Exception:
            next_est = None

        # Representative lat/lon
        lats = [e["lat"] for e in events if e["lat"]]
        lons = [e["lon"] for e in events if e["lon"]]
        avg_lat = sum(lats) / len(lats) if lats else 0
        avg_lon = sum(lons) / len(lons) if lons else 0

        results.append(
            {
                "region": region,
                "n_events": n,
                "events_per_year": round(lam, 2),
                "recurrence_years": round(recurrence_yr, 2) if recurrence_yr else None,
                "recurrence_months": round(recurrence_mo, 1) if recurrence_mo else None,
                "prob_1yr": round(prob_1yr * 100, 1),
                "prob_5yr": round(prob_5yr * 100, 1),
                "last_event_date": last_time[:10] if last_time else None,
                "next_estimated": next_est,
                "risk_color": _risk_color(prob_1yr),
                "lat": round(avg_lat, 2),
                "lon": round(avg_lon, 2),
            }
        )

    results.sort(key=lambda r: -(r.get("prob_1yr") or 0))
    return results


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        for k, v in CORS.items():
            self.send_header(k, v)
        self.end_headers()

    def do_GET(self):
        qs = parse_qs(urlparse(self.path).query)
        min_mag = float(qs.get("min_mag", ["7.0"])[0])

        predictions = _load_and_predict(min_mag)
        payload = {"min_mag": min_mag, "predictions": predictions}
        body = json.dumps(payload).encode()

        self.send_response(200)
        for k, v in CORS.items():
            self.send_header(k, v)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass

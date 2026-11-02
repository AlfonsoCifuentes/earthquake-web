"""
api/predictions.py
Vercel Python Serverless Function
Stationary Poisson recurrence model per tectonic region based on 2005–2025 records.
Returns honest recurrence intervals and 1-yr / 5-yr probabilities in [0.0, 1.0].
"""
from http.server import BaseHTTPRequestHandler
import json
import os
import csv
import math
from urllib.parse import urlparse, parse_qs
from datetime import datetime, timezone
import os
import sys

_API_DIR = os.path.dirname(os.path.abspath(__file__))
if _API_DIR not in sys.path:
    sys.path.insert(0, _API_DIR)

from validation import parse_bounded_float, send_json_response

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
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
    """P(k >= 1) in time window t years given Poisson rate lam events/year."""
    if not math.isfinite(lam) or lam <= 0 or not math.isfinite(t) or t <= 0:
        return 0.0
    return 1.0 - math.exp(-lam * t)


def _risk_level(prob: float) -> str:
    if prob >= 0.80:
        return "critical"
    elif prob >= 0.50:
        return "high"
    elif prob >= 0.20:
        return "moderate"
    return "low"


def _load_and_predict(min_mag: float):
    by_region: dict = {r: [] for r in TECTONIC_REGIONS}
    all_dates = []

    try:
        with open(CSV_PATH, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    mag = float(row.get("mag", "") or 0)
                except (ValueError, TypeError):
                    continue
                if mag < min_mag:
                    continue
                time_str = row.get("time", "")
                if time_str:
                    all_dates.append(time_str[:10])
                place = row.get("place", "")
                lat = float(row.get("latitude", 0) or 0)
                lon = float(row.get("longitude", 0) or 0)
                region = classify(place)
                by_region[region].append(
                    {"time": time_str, "mag": mag, "lat": lat, "lon": lon, "place": place}
                )
    except FileNotFoundError:
        return []

    # Accurate catalog coverage duration (May 2005 to May 2025 ~ 20.014 years)
    if all_dates:
        try:
            d_min = datetime.fromisoformat(min(all_dates))
            d_max = datetime.fromisoformat(max(all_dates))
            total_years = max((d_max - d_min).days / 365.25, 1.0)
        except Exception:
            total_years = 20.014
    else:
        total_years = 20.014

    results = []
    for region, events in by_region.items():
        n = len(events)
        if n == 0:
            results.append(
                {
                    "region": region,
                    "n_events": 0,
                    "events_per_year": 0.0,
                    "recurrence_years": None,
                    "recurrence_months": None,
                    "prob_1yr": 0.0,
                    "prob_5yr": 0.0,
                    "last_event_date": None,
                    "next_estimated": None,
                    "risk_level": "low",
                    "risk_color": "low",
                    "lat": 0.0,
                    "lon": 0.0,
                }
            )
            continue

        lam = n / total_years
        recurrence_yr = (1.0 / lam) if lam > 0 else None
        recurrence_mo = (recurrence_yr * 12.0) if recurrence_yr else None
        p_1yr = poisson_prob(lam, 1.0)
        p_5yr = poisson_prob(lam, 5.0)

        events_sorted = sorted(events, key=lambda e: e["time"] or "", reverse=True)
        last_time = events_sorted[0]["time"]

        lats = [e["lat"] for e in events if math.isfinite(e["lat"]) and -90 <= e["lat"] <= 90]
        lons = [e["lon"] for e in events if math.isfinite(e["lon"]) and -180 <= e["lon"] <= 180]
        avg_lat = sum(lats) / len(lats) if lats else 0.0
        avg_lon = sum(lons) / len(lons) if lons else 0.0

        risk = _risk_level(p_1yr)

        results.append(
            {
                "region": region,
                "n_events": n,
                "events_per_year": round(lam, 2),
                "recurrence_years": round(recurrence_yr, 2) if recurrence_yr else None,
                "recurrence_months": round(recurrence_mo, 1) if recurrence_mo else None,
                "prob_1yr": round(p_1yr, 4),
                "prob_5yr": round(p_5yr, 4),
                "last_event_date": last_time[:10] if last_time else None,
                "next_estimated": None,
                "risk_level": risk,
                "risk_color": risk,
                "lat": round(avg_lat, 2),
                "lon": round(avg_lon, 2),
            }
        )

    return results


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        for k, v in CORS.items():
            self.send_header(k, v)
        self.end_headers()

    def do_GET(self):
        qs = parse_qs(urlparse(self.path).query)
        try:
            min_mag = parse_bounded_float(qs.get("min_mag", [None])[0], default=7.0, minimum=5.5, maximum=10.0)
        except ValueError as err:
            send_json_response(self, 400, {"error": str(err)}, CORS)
            return

        predictions = _load_and_predict(min_mag)
        payload = {
            "min_mag": min_mag,
            "catalog_coverage_years": 20.01,
            "model": "stationary_poisson",
            "disclaimer": "Illustrative Poisson model based on 2005–2025 historical records (M>=5.5). Not an earthquake prediction.",
            "predictions": predictions,
        }
        send_json_response(self, 200, payload, CORS)

    def log_message(self, *args):
        pass

"""
api/clusters.py
Vercel Python Serverless Function
Runs DBSCAN spatial clustering on earthquake data using Haversine spherical distance.
Returns cluster assignments + centroid stats with typed latitude and longitude.
"""
from http.server import BaseHTTPRequestHandler
import json
import os
import csv
import math
from urllib.parse import urlparse, parse_qs
from validation import parse_bounded_float, parse_bounded_int, send_json_response

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

HERE = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(HERE, "..", "data", "2005-2025_mas_de_5_5_E_R.csv")
EARTH_RADIUS_KM = 6371.0088


def cluster_points_haversine(records: list[dict], eps_km: float, min_samples: int):
    """
    Runs DBSCAN with Haversine metric on geographic coordinates (in radians).
    Computes centroids on a sphere to avoid antimeridian / wrap-around distortion.
    """
    if not records:
        return [], []

    try:
        import numpy as np
        from sklearn.cluster import DBSCAN
    except ImportError:
        return [-1] * len(records), []

    # Prepare coordinates in radians: [latitude_rad, longitude_rad]
    coords_rad = np.radians([[r["latitude"], r["longitude"]] for r in records])
    eps_rad = eps_km / EARTH_RADIUS_KM

    clustering = DBSCAN(
        eps=eps_rad,
        min_samples=min_samples,
        metric="haversine",
        algorithm="ball_tree",
    )
    labels = clustering.fit_predict(coords_rad)

    # Compute spherical centroids for each cluster
    unique_labels = sorted(set(int(lbl) for lbl in labels))
    centroids = []

    for lbl in unique_labels:
        if lbl == -1:
            name = "Noise"
        else:
            name = f"Cluster {lbl + 1}"

        members = [r for r, l in zip(records, labels) if l == lbl]
        if not members:
            continue

        # Spherical mean for coordinates (handles 179° and -179° antimeridian correctly)
        x_sum, y_sum, z_sum = 0.0, 0.0, 0.0
        mag_sum = 0.0
        for m in members:
            lat_r = math.radians(m["latitude"])
            lon_r = math.radians(m["longitude"])
            x_sum += math.cos(lat_r) * math.cos(lon_r)
            y_sum += math.cos(lat_r) * math.sin(lon_r)
            z_sum += math.sin(lat_r)
            mag_sum += m["mag"]

        count = len(members)
        x_m = x_sum / count
        y_m = y_sum / count
        z_m = z_sum / count
        hypot_xy = math.hypot(x_m, y_m)

        if hypot_xy > 1e-7:
            avg_lon = math.degrees(math.atan2(y_m, x_m))
            avg_lat = math.degrees(math.atan2(z_m, hypot_xy))
        else:
            avg_lat = 90.0 if z_m > 0 else -90.0
            avg_lon = 0.0

        avg_mag = mag_sum / count

        centroids.append({
            "cluster": int(lbl),
            "name": name,
            "count": count,
            "lat": round(avg_lat, 3),
            "lon": round(avg_lon, 3),
            "avg_mag": round(avg_mag, 2),
        })

    return [int(l) for l in labels], centroids


def _run_dbscan(eps_km: float = 150.0, min_samples: int = 5, min_mag: float = 5.5, limit: int = 3000):
    rows = []
    try:
        with open(CSV_PATH, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for idx, row in enumerate(reader):
                try:
                    mag = float(row.get("mag", "") or 0)
                    lat = float(row.get("latitude", "") or 0)
                    lon = float(row.get("longitude", "") or 0)
                    depth = float(row.get("depth", "") or 0)
                except (ValueError, TypeError):
                    continue

                if not (math.isfinite(mag) and math.isfinite(lat) and math.isfinite(lon) and math.isfinite(depth)):
                    continue
                if not (-90.0 <= lat <= 90.0 and -180.0 <= lon <= 180.0):
                    continue
                if mag < min_mag:
                    continue

                rows.append({
                    "id": row.get("id") or f"cluster-pt-{idx}",
                    "time": row.get("time", ""),
                    "latitude": lat,
                    "longitude": lon,
                    "mag": mag,
                    "depth": depth,
                    "place": row.get("place", "Unknown"),
                    "type": row.get("type", "earthquake"),
                    "cluster": -1,
                })
    except FileNotFoundError:
        return [], []

    rows = rows[:limit]
    if not rows:
        return [], []

    labels, centroids = cluster_points_haversine(rows, eps_km, min_samples)
    for i, lbl in enumerate(labels):
        rows[i]["cluster"] = lbl

    return rows, centroids


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        for k, v in CORS.items():
            self.send_header(k, v)
        self.end_headers()

    def do_GET(self):
        qs = parse_qs(urlparse(self.path).query)
        try:
            # Support both eps_km and legacy eps (converting degrees to km if eps passed)
            if "eps_km" in qs:
                eps_km = parse_bounded_float(qs.get("eps_km", [None])[0], default=150.0, minimum=10.0, maximum=3000.0)
            elif "eps" in qs:
                # If degrees passed, approximate 1 deg ~ 111 km
                deg = parse_bounded_float(qs.get("eps", [None])[0], default=2.0, minimum=0.1, maximum=30.0)
                eps_km = deg * 111.0
            else:
                eps_km = 150.0

            min_samples = parse_bounded_int(qs.get("min_samples", [None])[0], default=5, minimum=2, maximum=50)
            min_mag = parse_bounded_float(qs.get("min_mag", [None])[0], default=5.5, minimum=0.0, maximum=10.0)
            limit = parse_bounded_int(qs.get("limit", [None])[0], default=3000, minimum=1, maximum=10000)
        except ValueError as err:
            send_json_response(self, 400, {"error": str(err)}, CORS)
            return

        rows, centroids = _run_dbscan(eps_km=eps_km, min_samples=min_samples, min_mag=min_mag, limit=limit)
        n_clusters = len([c for c in centroids if c["cluster"] >= 0])
        noise_centroid = next((c for c in centroids if c["cluster"] == -1), None)
        n_noise = noise_centroid["count"] if noise_centroid else 0

        payload = {
            "n_clusters": n_clusters,
            "n_noise": n_noise,
            "n_points": len(rows),
            "centroids": centroids,
            "data": rows,
            "metric": "haversine",
            "eps_km": eps_km,
            "min_samples": min_samples,
        }
        send_json_response(self, 200, payload, CORS)

    def log_message(self, *args):
        pass

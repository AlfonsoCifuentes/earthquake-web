"""
/api/clusters.py
Vercel Python Serverless Function
Runs DBSCAN spatial clustering on recent earthquake data.
Returns cluster assignments + centroid stats.
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


def _run_dbscan(eps: float, min_samples: int, min_mag: float, limit: int):
    try:
        import numpy as np
        from sklearn.cluster import DBSCAN
        from sklearn.preprocessing import StandardScaler
    except ImportError:
        return [], []

    rows = []
    try:
        with open(CSV_PATH, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    mag = float(row.get("mag", "") or 0)
                    lat = float(row.get("latitude", "") or 0)
                    lon = float(row.get("longitude", "") or 0)
                    depth = float(row.get("depth", "") or 0)
                except ValueError:
                    continue
                if mag < min_mag:
                    continue
                rows.append(
                    {
                        "lat": lat,
                        "lon": lon,
                        "mag": mag,
                        "depth": depth,
                        "place": row.get("place", ""),
                        "time": row.get("time", ""),
                    }
                )
    except FileNotFoundError:
        return [], []

    rows = rows[:limit]
    if not rows:
        return [], []

    X = np.array([[r["lat"], r["lon"]] for r in rows])
    X_scaled = StandardScaler().fit_transform(X)
    labels = DBSCAN(eps=eps, min_samples=min_samples).fit_predict(X_scaled)

    # Annotate rows with cluster
    for i, r in enumerate(rows):
        r["cluster"] = int(labels[i])

    # Compute cluster centroids
    unique_labels = sorted(set(labels))
    centroids = []
    for lbl in unique_labels:
        if lbl == -1:
            name = "Noise"
        else:
            name = f"Cluster {lbl + 1}"
        members = [r for r, l in zip(rows, labels) if l == lbl]
        avg_lat = sum(r["lat"] for r in members) / len(members)
        avg_lon = sum(r["lon"] for r in members) / len(members)
        avg_mag = sum(r["mag"] for r in members) / len(members)
        centroids.append(
            {
                "cluster": int(lbl),
                "name": name,
                "count": len(members),
                "lat": round(avg_lat, 3),
                "lon": round(avg_lon, 3),
                "avg_mag": round(avg_mag, 2),
            }
        )

    return rows, centroids


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        for k, v in CORS.items():
            self.send_header(k, v)
        self.end_headers()

    def do_GET(self):
        qs = parse_qs(urlparse(self.path).query)
        eps = float(qs.get("eps", ["0.5"])[0])
        min_samples = int(qs.get("min_samples", ["5"])[0])
        min_mag = float(qs.get("min_mag", ["5.5"])[0])
        limit = int(qs.get("limit", ["1000"])[0])

        rows, centroids = _run_dbscan(eps, min_samples, min_mag, limit)
        n_clusters = len([c for c in centroids if c["cluster"] != -1])
        n_noise = len([r for r in rows if r["cluster"] == -1])

        payload = {
            "n_clusters": n_clusters,
            "n_noise": n_noise,
            "n_points": len(rows),
            "centroids": centroids,
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

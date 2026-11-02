"""
Unit tests for api/clusters.py
Tests:
- Contract: latitude and longitude are returned, along with id, mag, depth, time, place, type, cluster.
- DBSCAN uses Haversine distance in km, handles antimeridian coordinates.
- Empty or invalid input handling.
"""
import pytest
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "api"))
import clusters


def test_clusters_contract():
    """Verify that _run_dbscan produces records with 'latitude' and 'longitude' (not only lat/lon)."""
    rows, centroids = clusters._run_dbscan(eps_km=300.0, min_samples=5, min_mag=6.0, limit=100)
    assert isinstance(rows, list)
    assert isinstance(centroids, list)
    if rows:
        r = rows[0]
        assert "latitude" in r, "Missing 'latitude' key in cluster point"
        assert "longitude" in r, "Missing 'longitude' key in cluster point"
        assert "id" in r, "Missing 'id' key in cluster point"
        assert "mag" in r
        assert "depth" in r
        assert "place" in r
        assert "cluster" in r
        assert -90 <= r["latitude"] <= 90
        assert -180 <= r["longitude"] <= 180


def test_clusters_empty_or_extreme():
    """Verify that empty datasets or impossibly high min_mag return empty lists without crashing."""
    rows, centroids = clusters._run_dbscan(eps_km=100.0, min_samples=5, min_mag=9.9, limit=100)
    assert isinstance(rows, list)
    assert isinstance(centroids, list)


def test_clusters_haversine_antimeridian():
    """Points near the antimeridian (e.g. 179°E and -179°W) should cluster together if distance is small."""
    test_points = [
        {"latitude": -16.0, "longitude": 179.5, "mag": 6.0, "depth": 20.0, "place": "Fiji E", "time": "2024-01-01T00:00:00Z", "id": "t1"},
        {"latitude": -16.0, "longitude": 179.8, "mag": 6.1, "depth": 25.0, "place": "Fiji E2", "time": "2024-01-01T01:00:00Z", "id": "t2"},
        {"latitude": -16.1, "longitude": -179.8, "mag": 6.2, "depth": 22.0, "place": "Fiji W", "time": "2024-01-01T02:00:00Z", "id": "t3"},
        {"latitude": -16.2, "longitude": -179.5, "mag": 6.0, "depth": 18.0, "place": "Fiji W2", "time": "2024-01-01T03:00:00Z", "id": "t4"},
        {"latitude": -16.0, "longitude": 179.9, "mag": 6.3, "depth": 20.0, "place": "Fiji C", "time": "2024-01-01T04:00:00Z", "id": "t5"},
    ]
    labels, centroids = clusters.cluster_points_haversine(test_points, eps_km=200.0, min_samples=3)
    # The points are only ~100 km apart across 180° meridian, so they must be in the same cluster (not noise -1)
    assert all(lbl >= 0 for lbl in labels[:5]), f"Antimeridian points failed to cluster: {labels}"
    assert len(set(labels[:5])) == 1, "Antimeridian points were split into multiple clusters"

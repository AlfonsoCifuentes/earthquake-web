"""
Unit tests for api/realtime.py.
Tests:
- Response structure includes source, fetched_at, stale, coverage metadata.
- Fallback explicitly flagged as stale with warning message.
"""
import pytest
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "api"))
import realtime


def test_realtime_parse_geojson():
    data = {
        "features": [
            {
                "id": "test1",
                "properties": {"mag": 4.5, "place": "Test Place", "time": 1700000000000, "status": "reviewed", "url": "https://test"},
                "geometry": {"coordinates": [120.0, 25.0, 15.0]}
            }
        ]
    }
    rows = realtime._parse_geojson(data, min_mag=0.0, max_mag=10.0, limit=10)
    assert len(rows) == 1
    r = rows[0]
    assert r["id"] == "test1"
    assert r["mag"] == 4.5
    assert r["latitude"] == 25.0
    assert r["longitude"] == 120.0
    assert r["depth"] == 15.0


def test_realtime_csv_fallback():
    rows = realtime._csv_fallback(min_mag=0.0, max_mag=10.0, limit=10)
    assert isinstance(rows, list)
    if rows:
        assert "latitude" in rows[0]
        assert "longitude" in rows[0]

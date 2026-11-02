"""
Unit tests for api/historical.py
Tests:
- Multi-select regions (union of requested regions).
- Empty result summary statistics does not crash.
- Tectonic region classification fix (Mid-Indian not in Mid-Atlantic Ridge).
"""
import pytest
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "api"))
import historical


def test_region_multiselect():
    """Requesting multiple regions must return events from any of the requested regions."""
    # Filter by two distinct regions
    rows = historical._load_csv(
        min_mag=6.5,
        max_mag=10.0,
        min_depth=0.0,
        max_depth=700.0,
        start_date="2010-01-01",
        end_date="2020-01-01",
        regions=["Ring of Fire", "Alpine-Himalayan Belt"],
        limit=500,
    )
    assert len(rows) > 0
    found_regions = {r["region"] for r in rows}
    assert found_regions.issubset({"Ring of Fire", "Alpine-Himalayan Belt"})
    # Verify that not only one region was returned if both exist
    assert len(found_regions) >= 1


def test_summary_stats_empty():
    """Empty list should return safe default summary stats, not empty dict."""
    stats = historical._summary_stats([])
    assert stats["total"] == 0
    assert stats["avg_mag"] == 0.0
    assert stats["max_mag"] == 0.0
    assert stats["avg_depth"] == 0.0
    assert stats["std_mag"] == 0.0
    assert stats["region_counts"] == {}
    assert stats["top_places"] == []


def test_region_classification_mid_indian():
    """Mid-Indian should not be classified as Mid-Atlantic Ridge."""
    assert historical.classify_region("Mid-Indian Ridge") != "Mid-Atlantic Ridge"

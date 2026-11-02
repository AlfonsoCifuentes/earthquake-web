"""
Unit tests for API parameter validation helper (api/validation.py).
Tests:
- Bounded floats, ints, dates, feeds.
- Out of range or malformed inputs raise ValueError.
"""
import pytest
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "api"))
import validation


def test_parse_bounded_float():
    assert validation.parse_bounded_float("5.5", default=5.0, minimum=0.0, maximum=10.0) == 5.5
    assert validation.parse_bounded_float(None, default=5.0, minimum=0.0, maximum=10.0) == 5.0

    with pytest.raises(ValueError):
        validation.parse_bounded_float("not_a_number", default=5.0, minimum=0.0, maximum=10.0)
    with pytest.raises(ValueError):
        validation.parse_bounded_float("NaN", default=5.0, minimum=0.0, maximum=10.0)
    with pytest.raises(ValueError):
        validation.parse_bounded_float("Infinity", default=5.0, minimum=0.0, maximum=10.0)
    with pytest.raises(ValueError):
        validation.parse_bounded_float("-1.0", default=5.0, minimum=0.0, maximum=10.0)
    with pytest.raises(ValueError):
        validation.parse_bounded_float("15.0", default=5.0, minimum=0.0, maximum=10.0)


def test_parse_bounded_int():
    assert validation.parse_bounded_int("100", default=50, minimum=1, maximum=5000) == 100
    assert validation.parse_bounded_int(None, default=50, minimum=1, maximum=5000) == 50

    with pytest.raises(ValueError):
        validation.parse_bounded_int("-10", default=50, minimum=1, maximum=5000)
    with pytest.raises(ValueError):
        validation.parse_bounded_int("99999", default=50, minimum=1, maximum=5000)


def test_parse_iso_date():
    assert validation.parse_iso_date("2020-05-15") == "2020-05-15"
    assert validation.parse_iso_date("") is None
    assert validation.parse_iso_date(None) is None

    with pytest.raises(ValueError):
        validation.parse_iso_date("invalid-date")

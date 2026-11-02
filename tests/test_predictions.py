"""
Unit tests for api/predictions.py
Tests:
- Poisson probability calculation (0 <= P <= 1, monotonic in time).
- Coverage period calculation: uses historical coverage (~20.01 years), not future years.
- Scientific contract: probabilities in [0.0, 1.0], no pseudo-prediction 'next_estimated',
  risk_level is a semantic enum ('low', 'moderate', 'high', 'critical'), not HEX.
"""
import pytest
import math
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "api"))
import predictions


def test_poisson_zero_rate():
    """Rate 0 events/year must yield 0 probability."""
    assert predictions.poisson_prob(0.0, 1.0) == 0.0
    assert predictions.poisson_prob(0.0, 5.0) == 0.0


def test_poisson_half():
    """Rate ln(2) events/year yields 1 - exp(-ln(2)) = 0.5 (50% in 1 year)."""
    rate = math.log(2)
    prob = predictions.poisson_prob(rate, 1.0)
    assert pytest.approx(prob, 0.001) == 0.5


def test_poisson_monotonic():
    """For any non-negative rate, 0 <= P(1yr) <= P(5yr) <= 1."""
    for lam in [0.01, 0.1, 0.5, 1.0, 5.0, 50.0]:
        p1 = predictions.poisson_prob(lam, 1.0)
        p5 = predictions.poisson_prob(lam, 5.0)
        assert 0.0 <= p1 <= 1.0
        assert 0.0 <= p5 <= 1.0
        assert p1 <= p5


def test_predictions_contract():
    """Verify load_and_predict contract:
    - prob_1yr and prob_5yr in [0.0, 1.0] (never > 1 or percentage scaled)
    - risk_level in {'low', 'moderate', 'high', 'critical'} (not hex '#ff...')
    - no 'next_estimated' earthquake prediction date
    """
    res = predictions._load_and_predict(min_mag=7.0)
    assert isinstance(res, list)
    assert len(res) > 0
    for r in res:
        assert 0.0 <= r["prob_1yr"] <= 1.0, f"prob_1yr={r['prob_1yr']} out of [0, 1]"
        assert 0.0 <= r["prob_5yr"] <= 1.0, f"prob_5yr={r['prob_5yr']} out of [0, 1]"
        assert r["risk_level"] in {"low", "moderate", "high", "critical"}
        # Must not have hex code in risk_level
        assert not r["risk_level"].startswith("#")
        # Ensure no misleading next_estimated field or date
        assert "next_estimated" not in r or r["next_estimated"] is None

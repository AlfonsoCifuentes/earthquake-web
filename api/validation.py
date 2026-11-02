"""
api/validation.py
Safe input parsing and HTTP response helpers for Python serverless endpoints.
"""
import math
import json
from datetime import datetime


def parse_bounded_float(raw, default: float, minimum: float, maximum: float) -> float:
    if raw is None or (isinstance(raw, str) and raw.strip() == ""):
        return float(default)
    try:
        val = float(raw)
    except (TypeError, ValueError):
        raise ValueError(f"Expected a numeric float, got '{raw}'")
    if not math.isfinite(val):
        raise ValueError("Non-finite numeric value (NaN or Infinity) not permitted")
    if val < minimum or val > maximum:
        raise ValueError(f"Value {val} out of allowed range [{minimum}, {maximum}]")
    return val


def parse_bounded_int(raw, default: int, minimum: int, maximum: int) -> int:
    if raw is None or (isinstance(raw, str) and raw.strip() == ""):
        return int(default)
    try:
        val = int(raw)
    except (TypeError, ValueError):
        raise ValueError(f"Expected an integer, got '{raw}'")
    if val < minimum or val > maximum:
        raise ValueError(f"Value {val} out of allowed range [{minimum}, {maximum}]")
    return val


def parse_iso_date(raw: str | None) -> str | None:
    if not raw or not raw.strip():
        return None
    cleaned = raw.strip()
    # Expect YYYY-MM-DD or full ISO
    try:
        if len(cleaned) == 10:
            datetime.strptime(cleaned, "%Y-%m-%d")
            return cleaned
        else:
            datetime.fromisoformat(cleaned.replace("Z", "+00:00"))
            return cleaned[:10]
    except Exception:
        raise ValueError(f"Invalid date format '{raw}'; expected YYYY-MM-DD")


def send_json_response(handler, status_code: int, data: dict, cors_headers: dict) -> None:
    body = json.dumps(data).encode("utf-8")
    handler.send_response(status_code)
    for k, v in cors_headers.items():
        handler.send_header(k, v)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)

import { describe, it, expect } from "vitest";
import { formatProbability, formatMagnitude, formatDepth } from "../lib/format";

describe("formatProbability", () => {
  it("formats 0.5 as 50.0%", () => {
    expect(formatProbability(0.5)).toBe("50.0%");
  });

  it("formats 0 as 0.0%", () => {
    expect(formatProbability(0)).toBe("0.0%");
  });

  it("formats 1.0 as 100.0%", () => {
    expect(formatProbability(1.0)).toBe("100.0%");
  });

  it("returns dash for null or undefined", () => {
    expect(formatProbability(null)).toBe("—");
    expect(formatProbability(undefined)).toBe("—");
  });

  it("returns dash for NaN, Infinity, negative, or > 1 values", () => {
    expect(formatProbability(NaN)).toBe("—");
    expect(formatProbability(Infinity)).toBe("—");
    expect(formatProbability(-0.1)).toBe("—");
    expect(formatProbability(1.01)).toBe("—");
    expect(formatProbability(50)).toBe("—"); // never treat 50 as 5000%
  });
});

describe("formatMagnitude", () => {
  it("formats magnitude to 1 decimal place", () => {
    expect(formatMagnitude(6.78)).toBe("M 6.8");
    expect(formatMagnitude(null)).toBe("—");
  });
});

describe("formatDepth", () => {
  it("formats depth with km unit", () => {
    expect(formatDepth(10.5)).toBe("10.5 km");
    expect(formatDepth(null)).toBe("—");
  });
});

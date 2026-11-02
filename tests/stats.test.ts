import { describe, it, expect } from "vitest";
import { calculateLinearRegression, calculatePearson } from "../lib/stats";

describe("calculateLinearRegression", () => {
  it("computes slope and intercept for valid non-zero variance data", () => {
    const x = [1, 2, 3, 4, 5];
    const y = [2, 4, 6, 8, 10]; // y = 2x
    const res = calculateLinearRegression(x, y);
    expect(res).not.toBeNull();
    expect(res?.slope).toBeCloseTo(2);
    expect(res?.intercept).toBeCloseTo(0);
  });

  it("returns null for empty arrays or single data point", () => {
    expect(calculateLinearRegression([], [])).toBeNull();
    expect(calculateLinearRegression([1], [2])).toBeNull();
  });

  it("returns null when variance of x is 0 (all x are identical)", () => {
    const x = [5, 5, 5, 5];
    const y = [1, 2, 3, 4];
    expect(calculateLinearRegression(x, y)).toBeNull();
  });
});

describe("calculatePearson", () => {
  it("calculates exact correlation for collinear data", () => {
    expect(calculatePearson([1, 2, 3], [2, 4, 6])).toBeCloseTo(1.0);
    expect(calculatePearson([1, 2, 3], [6, 4, 2])).toBeCloseTo(-1.0);
  });

  it("returns null for empty data or zero variance (instead of falsifying 0.00)", () => {
    expect(calculatePearson([], [])).toBeNull();
    expect(calculatePearson([1], [2])).toBeNull();
    expect(calculatePearson([5, 5, 5], [1, 2, 3])).toBeNull();
  });
});

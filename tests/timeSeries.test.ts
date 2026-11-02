import { describe, it, expect } from "vitest";
import { computeRetrospective7DayAverage, fillDailyContinuousSeries } from "../lib/temporal";

describe("computeRetrospective7DayAverage", () => {
  it("produces null for the first 6 days and exact mean on day 7", () => {
    const sequence = [1, 2, 3, 4, 5, 6, 7]; // sum is 28, mean is 4
    const result = computeRetrospective7DayAverage(sequence);
    expect(result.length).toBe(7);
    for (let i = 0; i < 6; i++) {
      expect(result[i]).toBeNull();
    }
    expect(result[6]).toBe(4);
  });

  it("handles empty array without throwing", () => {
    expect(computeRetrospective7DayAverage([])).toEqual([]);
  });
});

describe("fillDailyContinuousSeries", () => {
  it("fills missing dates with 0 counts", () => {
    const sparse = [
      { date: "2024-01-01", count: 5 },
      { date: "2024-01-04", count: 2 },
    ];
    const continuous = fillDailyContinuousSeries(sparse);
    expect(continuous.map((c) => c.date)).toEqual([
      "2024-01-01",
      "2024-01-02",
      "2024-01-03",
      "2024-01-04",
    ]);
    expect(continuous.map((c) => c.count)).toEqual([5, 0, 0, 2]);
  });
});

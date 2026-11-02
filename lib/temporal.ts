/* lib/temporal.ts — Temporal analytics utilities */

/**
 * Computes a strictly retrospective 7-day moving average.
 * For index i < 6, returns null (not enough preceding days for a full 7-day window).
 * For index i >= 6, returns average of counts[i-6...i] / 7.
 */
export function computeRetrospective7DayAverage(
  counts: number[]
): (number | null)[] {
  if (!counts.length) return [];
  return counts.map((_, i) => {
    if (i < 6) return null;
    const window = counts.slice(i - 6, i + 1);
    const sum = window.reduce((acc, val) => acc + val, 0);
    return sum / 7;
  });
}

/**
 * Ensures daily sequence is continuous with 0s for missing days between min and max dates.
 */
export function fillDailyContinuousSeries(
  entries: { date: string; count: number }[]
): { date: string; count: number }[] {
  if (entries.length === 0) return [];

  const countMap = new Map<string, number>();
  for (const e of entries) {
    countMap.set(e.date, (countMap.get(e.date) ?? 0) + e.count);
  }

  const sortedDates = Array.from(countMap.keys()).sort();
  const startDate = new Date(sortedDates[0] + "T00:00:00Z");
  const endDate = new Date(sortedDates[sortedDates.length - 1] + "T00:00:00Z");

  const result: { date: string; count: number }[] = [];
  const cur = new Date(startDate);

  while (cur <= endDate) {
    const dStr = cur.toISOString().slice(0, 10);
    result.push({
      date: dStr,
      count: countMap.get(dStr) ?? 0,
    });
    cur.setUTCDate(cur.getUTCDate() + 1);
  }

  return result;
}

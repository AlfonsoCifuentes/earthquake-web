/* lib/stats.ts — Robust statistical calculations */

export interface RegressionResult {
  slope: number;
  intercept: number;
}

/**
 * Calculates linear regression y = slope * x + intercept.
 * Returns null if n < 2, or if variance of x is 0, or if non-finite numbers occur.
 */
export function calculateLinearRegression(
  x: number[],
  y: number[]
): RegressionResult | null {
  const n = x.length;
  if (n < 2 || y.length !== n) return null;

  const validPairs: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    if (Number.isFinite(x[i]) && Number.isFinite(y[i])) {
      validPairs.push([x[i], y[i]]);
    }
  }

  if (validPairs.length < 2) return null;

  const m = validPairs.length;
  const mx = validPairs.reduce((s, p) => s + p[0], 0) / m;
  const my = validPairs.reduce((s, p) => s + p[1], 0) / m;

  let num = 0;
  let den = 0;

  for (const [xi, yi] of validPairs) {
    const dx = xi - mx;
    const dy = yi - my;
    num += dx * dy;
    den += dx * dx;
  }

  if (den === 0 || !Number.isFinite(den)) return null;

  const slope = num / den;
  const intercept = my - slope * mx;

  if (!Number.isFinite(slope) || !Number.isFinite(intercept)) return null;

  return { slope, intercept };
}

/**
 * Calculates Pearson correlation coefficient between two arrays.
 * Returns null if n < 2, or if either variance is 0, or if non-finite values occur.
 */
export function calculatePearson(a: number[], b: number[]): number | null {
  const n = a.length;
  if (n < 2 || b.length !== n) return null;

  const validPairs: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    if (Number.isFinite(a[i]) && Number.isFinite(b[i])) {
      validPairs.push([a[i], b[i]]);
    }
  }

  if (validPairs.length < 2) return null;

  const m = validPairs.length;
  const ma = validPairs.reduce((s, p) => s + p[0], 0) / m;
  const mb = validPairs.reduce((s, p) => s + p[1], 0) / m;

  let num = 0;
  let da = 0;
  let db = 0;

  for (const [ai, bi] of validPairs) {
    const A = ai - ma;
    const B = bi - mb;
    num += A * B;
    da += A * A;
    db += B * B;
  }

  if (da <= 0 || db <= 0) return null;

  const r = num / Math.sqrt(da * db);
  if (!Number.isFinite(r)) return null;

  // Bound to [-1, 1] due to floating point inaccuracies
  return Math.max(-1, Math.min(1, r));
}

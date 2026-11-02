/* lib/format.ts — Rigorous formatting helpers */

/**
 * Formats a probability in range [0, 1] as a percentage string (e.g. 0.5 -> "50.0%").
 * Returns "—" for null, undefined, NaN, Infinity, or values out of bounds [0, 1].
 */
export function formatProbability(p: number | null | undefined): string {
  if (p === null || p === undefined || !Number.isFinite(p) || p < 0 || p > 1) {
    return "—";
  }
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(p);
}

/**
 * Formats an earthquake magnitude (e.g. 6.8 -> "M 6.8").
 */
export function formatMagnitude(mag: number | null | undefined): string {
  if (mag === null || mag === undefined || !Number.isFinite(mag)) {
    return "—";
  }
  return `M ${mag.toFixed(1)}`;
}

/**
 * Formats an earthquake focal depth (e.g. 10.5 -> "10.5 km").
 */
export function formatDepth(depth: number | null | undefined): string {
  if (depth === null || depth === undefined || !Number.isFinite(depth)) {
    return "—";
  }
  return `${depth.toFixed(1)} km`;
}

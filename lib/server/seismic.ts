/*
 * lib/server/seismic.ts
 * TypeScript port of the former Python serverless functions in api/*.py
 * (realtime, historical, alerts, predictions, clusters), so the API runs on
 * Cloudflare Workers next to the Next.js app. Behaviour and payload shapes
 * match the Python versions.
 */
import historicalRaw from "./data/historical.json";
import allMonthRaw from "./data/all_month.json";

type Row = Record<string, string>;
const HISTORICAL = historicalRaw as Row[];
const ALL_MONTH = allMonthRaw as Row[];

export const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export class BadRequest extends Error {}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS,
      "Content-Type": "application/json",
      "Cache-Control": "s-maxage=60, stale-while-revalidate=300",
    },
  });
}

export function options(): Response {
  return new Response(null, { status: 200, headers: CORS });
}

const round = (v: number, d: number) => {
  const f = 10 ** d;
  return Math.round(v * f) / f;
};

/** Python `float(x or 0)`; returns null where Python would raise. */
function pyFloat(raw: string | undefined): number | null {
  if (raw === undefined || raw === null || raw === "") return 0;
  const v = Number(raw);
  return Number.isNaN(v) && raw.trim().toLowerCase() !== "nan" ? null : v;
}

export function parseBoundedFloat(raw: string | null, def: number, min: number, max: number): number {
  if (raw === null || raw.trim() === "") return def;
  const t = raw.trim().toLowerCase();
  const val = /^[+-]?(inf|infinity)$/.test(t) ? Infinity : t === "nan" ? NaN : Number(t);
  if (Number.isNaN(val) && t !== "nan") throw new BadRequest(`Expected a numeric float, got '${raw}'`);
  if (!Number.isFinite(val)) throw new BadRequest("Non-finite numeric value (NaN or Infinity) not permitted");
  if (val < min || val > max) throw new BadRequest(`Value ${val} out of allowed range [${min}, ${max}]`);
  return val;
}

export function parseBoundedInt(raw: string | null, def: number, min: number, max: number): number {
  if (raw === null || raw.trim() === "") return def;
  if (!/^\s*[+-]?\d+\s*$/.test(raw)) throw new BadRequest(`Expected an integer, got '${raw}'`);
  const val = parseInt(raw, 10);
  if (val < min || val > max) throw new BadRequest(`Value ${val} out of allowed range [${min}, ${max}]`);
  return val;
}

export function parseIsoDate(raw: string | null): string | null {
  if (!raw || !raw.trim()) return null;
  const cleaned = raw.trim();
  const d = new Date(cleaned.length === 10 ? `${cleaned}T00:00:00Z` : cleaned);
  if (Number.isNaN(d.getTime()) || (cleaned.length === 10 && !/^\d{4}-\d{2}-\d{2}$/.test(cleaned))) {
    throw new BadRequest(`Invalid date format '${raw}'; expected YYYY-MM-DD`);
  }
  return cleaned.slice(0, 10);
}

const isoFromMs = (ms: number) => new Date(ms).toISOString().replace("Z", "+00:00");
const byTimeDesc = (a: { time: string | null }, b: { time: string | null }) =>
  (b.time || "").localeCompare(a.time || "");

// ───────────────────────────── realtime ─────────────────────────────
const USGS_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson";

interface GeoFeature {
  id?: string;
  properties?: Record<string, unknown>;
  geometry?: { coordinates?: (number | null)[] };
}

function parseGeojson(data: { features?: GeoFeature[] }, minMag: number, maxMag: number, limit: number) {
  const rows = [];
  for (const f of data.features || []) {
    const p = f.properties || {};
    const g = f.geometry || {};
    if (p.mag === null || p.mag === undefined) continue;
    const mag = Number(p.mag);
    if (Number.isNaN(mag)) continue;
    if (!(minMag <= mag && mag <= maxMag)) continue;
    const coords = g.coordinates || [null, null, null];
    if (coords.length < 3) continue;
    const [lon, lat, depth] = coords;
    if (lat === null || lon === null || depth === null) continue;
    const latF = Number(lat), lonF = Number(lon), depthF = Number(depth);
    if (![latF, lonF, depthF].every(Number.isFinite)) continue;
    if (!(-90 <= latF && latF <= 90 && -180 <= lonF && lonF <= 180)) continue;
    const ts = p.time as number | undefined;
    rows.push({
      time: ts ? isoFromMs(ts) : null,
      mag: round(mag, 2),
      depth: round(depthF, 1),
      latitude: round(latF, 4),
      longitude: round(lonF, 4),
      place: (p.place as string) || "Unknown",
      type: (p.type as string) ?? "earthquake",
      status: (p.status as string) ?? "",
      id: f.id ?? "",
      url: (p.url as string) ?? "",
    });
  }
  rows.sort(byTimeDesc);
  return rows.slice(0, limit);
}

function csvFallback(minMag: number, maxMag: number, limit: number) {
  const rows = [];
  for (const row of ALL_MONTH) {
    const mag = pyFloat(row.mag), depth = pyFloat(row.depth), lat = pyFloat(row.latitude), lon = pyFloat(row.longitude);
    if (mag === null || depth === null || lat === null || lon === null) continue;
    if (!(minMag <= mag && mag <= maxMag)) continue;
    if (!(-90 <= lat && lat <= 90 && -180 <= lon && lon <= 180)) continue;
    rows.push({
      time: row.time || "",
      mag: round(mag, 2),
      depth: round(depth, 1),
      latitude: round(lat, 4),
      longitude: round(lon, 4),
      place: row.place || "Unknown",
      type: row.type || "earthquake",
      status: row.status || "",
      id: row.id || "",
      url: "",
    });
  }
  rows.sort(byTimeDesc);
  return rows.slice(0, limit);
}

export async function realtime(qs: URLSearchParams) {
  const minMag = parseBoundedFloat(qs.get("min_mag"), 0, 0, 10);
  const maxMag = parseBoundedFloat(qs.get("max_mag"), 10, 0, 10);
  if (minMag > maxMag) throw new BadRequest(`min_mag (${minMag}) cannot exceed max_mag (${maxMag})`);
  const limit = parseBoundedInt(qs.get("limit"), 2000, 1, 10000);

  const nowUtc = isoFromMs(Date.now());
  let rows;
  let source = "usgs";
  let stale = false;
  let warning: string | null = null;
  try {
    const res = await fetch(USGS_URL, {
      headers: { "User-Agent": "SeismicAtlas/1.0 (EarthquakeWeb)" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    rows = parseGeojson(await res.json(), minMag, maxMag, limit);
  } catch (exc) {
    rows = csvFallback(minMag, maxMag, limit);
    source = "local_csv_fallback";
    stale = true;
    warning = `Live USGS feed temporarily unreachable (${exc}); displaying cached local fallback.`;
  }
  const times = rows.map((r) => r.time).filter(Boolean).sort() as string[];
  return {
    count: rows.length,
    source,
    fetched_at: nowUtc,
    stale,
    warning,
    coverage: {
      kind: stale ? "local_snapshot" : "rolling_month",
      start: times[0] ?? null,
      end: times[times.length - 1] ?? null,
      minimum_magnitude: minMag,
      maximum_magnitude: maxMag,
    },
    data: rows,
  };
}

// ───────────────────────────── historical ─────────────────────────────
const HIST_REGIONS: Record<string, string[]> = {
  "Ring of Fire": [
    "japan", "indonesia", "philippines", "chile", "peru", "mexico",
    "alaska", "tonga", "vanuatu", "papua new guinea", "new zealand",
    "fiji", "solomon", "kermadec", "marianas", "ryukyu",
  ],
  "Alpine-Himalayan Belt": [
    "turkey", "greece", "italy", "iran", "pakistan", "india",
    "nepal", "afghanistan", "tajikistan", "uzbekistan", "georgia",
    "caucasus", "hindu kush",
  ],
  "Mid-Atlantic Ridge": ["atlantic", "mid-atlantic", "azores", "iceland", "south atlantic"],
};

function classifyRegion(place: string): string {
  const pl = (place || "").toLowerCase();
  for (const [region, kws] of Object.entries(HIST_REGIONS)) {
    if (kws.some((k) => pl.includes(k))) return region;
  }
  return "Other Regions";
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
function stdev(xs: number[]) {
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1));
}

export function historical(qs: URLSearchParams) {
  const minMag = parseBoundedFloat(qs.get("min_mag"), 5.5, 0, 10);
  const maxMag = parseBoundedFloat(qs.get("max_mag"), 10, 0, 10);
  if (minMag > maxMag) throw new BadRequest(`min_mag (${minMag}) cannot exceed max_mag (${maxMag})`);
  const minDepth = parseBoundedFloat(qs.get("min_depth"), 0, 0, 1000);
  const maxDepth = parseBoundedFloat(qs.get("max_depth"), 700, 0, 1000);
  if (minDepth > maxDepth) throw new BadRequest(`min_depth (${minDepth}) cannot exceed max_depth (${maxDepth})`);
  const startDate = parseIsoDate(qs.get("start_date"));
  const endDate = parseIsoDate(qs.get("end_date"));
  if (startDate && endDate && startDate > endDate) {
    throw new BadRequest(`start_date (${startDate}) cannot be after end_date (${endDate})`);
  }
  const requested = new Set(qs.getAll("region").filter((r) => r && r !== "All"));
  const limit = parseBoundedInt(qs.get("limit"), 5000, 1, 10000);

  let rows = [];
  for (const row of HISTORICAL) {
    const mag = pyFloat(row.mag), depth = pyFloat(row.depth), lat = pyFloat(row.latitude), lon = pyFloat(row.longitude);
    if (mag === null || depth === null || lat === null || lon === null) continue;
    if (![mag, depth, lat, lon].every(Number.isFinite)) continue;
    if (!(minMag <= mag && mag <= maxMag)) continue;
    if (!(minDepth <= depth && depth <= maxDepth)) continue;
    const time = row.time || "";
    if (startDate && time && time.slice(0, 10) < startDate) continue;
    if (endDate && time && time.slice(0, 10) > endDate) continue;
    const place = row.place || "";
    const region = classifyRegion(place);
    if (requested.size && !requested.has(region)) continue;
    rows.push({
      time,
      mag: round(mag, 2),
      depth: round(depth, 1),
      latitude: round(lat, 4),
      longitude: round(lon, 4),
      place,
      type: row.type || "earthquake",
      magType: row.magType || "",
      id: row.id || "",
      status: row.status || "",
      region,
    });
  }
  rows.sort(byTimeDesc);
  rows = rows.slice(0, limit);

  let stats;
  if (!rows.length) {
    stats = {
      total: 0, avg_mag: 0, max_mag: 0, avg_depth: 0, std_mag: 0,
      region_counts: {}, top_places: [],
      mag_distribution: { "<6": 0, "6-6.9": 0, "7-7.9": 0, "8+": 0 },
    };
  } else {
    const mags = rows.map((r) => r.mag);
    const depths = rows.map((r) => r.depth);
    const regionCounts: Record<string, number> = {};
    const placeCounts = new Map<string, number>();
    for (const r of rows) {
      regionCounts[r.region] = (regionCounts[r.region] || 0) + 1;
      placeCounts.set(r.place, (placeCounts.get(r.place) || 0) + 1);
    }
    const topPlaces = [...placeCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
    const dist = { "<6": 0, "6-6.9": 0, "7-7.9": 0, "8+": 0 };
    for (const m of mags) {
      if (m < 6) dist["<6"]++;
      else if (m < 7) dist["6-6.9"]++;
      else if (m < 8) dist["7-7.9"]++;
      else dist["8+"]++;
    }
    stats = {
      total: rows.length,
      avg_mag: round(mean(mags), 2),
      max_mag: round(Math.max(...mags), 2),
      avg_depth: round(mean(depths), 1),
      std_mag: mags.length > 1 ? round(stdev(mags), 3) : 0,
      region_counts: regionCounts,
      top_places: topPlaces.map(([place, count]) => ({ place, count })),
      mag_distribution: dist,
    };
  }
  return {
    stats,
    data: rows,
    coverage: {
      dataset: "2005-2025_mas_de_5_5_E_R.csv",
      start: "2005-05-03",
      end: "2025-05-08",
      minimum_magnitude: 5.5,
    },
  };
}

// ───────────────────────────── alerts ─────────────────────────────
const FEEDS: Record<string, string> = {
  significant_week: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_week.geojson",
  "m4.5_day": "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson",
  "m2.5_hour": "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_hour.geojson",
};
const ALERT_COLORS: Record<string, string> = {
  critical: "#ff3b30",
  high: "#ff9500",
  moderate: "#ffd60a",
  low: "#30d158",
};
const alertLevel = (mag: number) => (mag >= 7 ? "critical" : mag >= 6 ? "high" : mag >= 5 ? "moderate" : "low");

export async function alerts(qs: URLSearchParams) {
  const feedType = qs.get("feed") ?? "significant_week";
  if (!(feedType in FEEDS)) {
    throw new BadRequest(`Unknown feed '${feedType}'. Allowed: ['${Object.keys(FEEDS).join("', '")}']`);
  }
  const limit = parseBoundedInt(qs.get("limit"), 50, 1, 500);
  let data: { features?: GeoFeature[] } | null = null;
  try {
    const res = await fetch(FEEDS[feedType], {
      headers: { "User-Agent": "SeismicAtlas/1.0 (Alerts)" },
      signal: AbortSignal.timeout(10_000),
    });
    if (res.ok) data = await res.json();
  } catch {
    data = null;
  }
  const nowMs = Date.now();
  const rows = ((data && data.features) || []).slice(0, limit).map((f) => {
    const p = f.properties || {};
    const coords = (f.geometry && f.geometry.coordinates) || [null, null, null];
    let mag = Number(p.mag || 0);
    if (Number.isNaN(mag)) mag = 0;
    const ts = p.time as number | undefined;
    const lon = coords.length > 0 ? coords[0] : null;
    const lat = coords.length > 1 ? coords[1] : null;
    const depth = coords.length > 2 ? coords[2] : null;
    const level = alertLevel(mag);
    return {
      id: f.id ?? "",
      time: ts ? isoFromMs(ts) : null,
      age_hours: round(ts ? (nowMs - ts) / 3_600_000 : 9999, 1),
      mag: round(mag, 2),
      place: (p.place as string) || "Unknown location",
      depth: depth !== null && depth !== undefined ? round(depth, 1) : null,
      latitude: lat !== null && lat !== undefined ? round(lat, 4) : null,
      longitude: lon !== null && lon !== undefined ? round(lon, 4) : null,
      alert: level,
      alert_color: ALERT_COLORS[level],
      url: (p.url as string) ?? "",
      felt: p.felt ?? null,
      cdi: p.cdi ?? null,
      mmi: p.mmi ?? null,
      tsunami: p.tsunami ?? 0,
    };
  });
  const count = (lvl: string) => rows.filter((r) => r.alert === lvl).length;
  return {
    feed: feedType,
    source: "usgs",
    count: rows.length,
    disclaimer:
      "Alert levels (Critical, High, Moderate, Low) are magnitude-based brackets (M>=7, M>=6, M>=5, <M5), not official PAGER loss estimates. Tsunami flag indicates ocean event evaluation by warning centers.",
    summary: { critical: count("critical"), high: count("high"), moderate: count("moderate"), low: count("low") },
    data: rows,
  };
}

// ───────────────────────────── predictions ─────────────────────────────
const PRED_REGIONS: Record<string, string[]> = {
  "Ring of Fire (West Pacific)": [
    "Japan", "Indonesia", "Philippines", "Papua New Guinea", "Tonga",
    "Vanuatu", "Solomon", "Kermadec", "Marianas", "Ryukyu", "Fiji",
  ],
  "Ring of Fire (East Pacific)": [
    "Chile", "Peru", "Ecuador", "Colombia", "Mexico", "Central America", "Alaska", "Aleutian",
  ],
  "Alpine-Himalayan Belt": [
    "Turkey", "Greece", "Iran", "Pakistan", "India", "Nepal", "Afghanistan", "Tajikistan", "Hindu Kush", "Caucasus",
  ],
  "Mid-Atlantic Ridge": ["Atlantic", "Azores", "Iceland"],
  "Other Regions": [],
};

function classifyPred(place: string): string {
  const pl = place.toLowerCase();
  for (const [region, kws] of Object.entries(PRED_REGIONS)) {
    if (region === "Other Regions") continue;
    if (kws.some((k) => pl.includes(k.toLowerCase()))) return region;
  }
  return "Other Regions";
}

const poissonProb = (lam: number, t = 1) =>
  !Number.isFinite(lam) || lam <= 0 || !Number.isFinite(t) || t <= 0 ? 0 : 1 - Math.exp(-lam * t);
const riskLevel = (p: number) => (p >= 0.8 ? "critical" : p >= 0.5 ? "high" : p >= 0.2 ? "moderate" : "low");

export function predictions(qs: URLSearchParams) {
  const minMag = parseBoundedFloat(qs.get("min_mag"), 7.0, 5.5, 10);
  const byRegion: Record<string, { time: string; mag: number; lat: number; lon: number }[]> = {};
  for (const r of Object.keys(PRED_REGIONS)) byRegion[r] = [];
  const allDates: string[] = [];
  for (const row of HISTORICAL) {
    const mag = pyFloat(row.mag);
    if (mag === null || mag < minMag) continue;
    const time = row.time || "";
    if (time) allDates.push(time.slice(0, 10));
    const place = row.place || "";
    byRegion[classifyPred(place)].push({
      time,
      mag,
      lat: Number(row.latitude || 0),
      lon: Number(row.longitude || 0),
    });
  }
  let totalYears = 20.014;
  if (allDates.length) {
    allDates.sort();
    const dMin = Date.parse(`${allDates[0]}T00:00:00Z`);
    const dMax = Date.parse(`${allDates[allDates.length - 1]}T00:00:00Z`);
    if (Number.isFinite(dMin) && Number.isFinite(dMax)) {
      totalYears = Math.max(Math.floor((dMax - dMin) / 86_400_000) / 365.25, 1);
    }
  }
  const results = Object.entries(byRegion).map(([region, events]) => {
    const n = events.length;
    if (n === 0) {
      return {
        region, n_events: 0, events_per_year: 0, recurrence_years: null, recurrence_months: null,
        prob_1yr: 0, prob_5yr: 0, last_event_date: null, next_estimated: null,
        risk_level: "low", risk_color: "low", lat: 0, lon: 0,
      };
    }
    const lam = n / totalYears;
    const recYr = lam > 0 ? 1 / lam : null;
    const recMo = recYr ? recYr * 12 : null;
    const p1 = poissonProb(lam, 1);
    const p5 = poissonProb(lam, 5);
    const last = [...events].sort(byTimeDesc)[0].time;
    const lats = events.map((e) => e.lat).filter((v) => Number.isFinite(v) && v >= -90 && v <= 90);
    const lons = events.map((e) => e.lon).filter((v) => Number.isFinite(v) && v >= -180 && v <= 180);
    const risk = riskLevel(p1);
    return {
      region,
      n_events: n,
      events_per_year: round(lam, 2),
      recurrence_years: recYr ? round(recYr, 2) : null,
      recurrence_months: recMo ? round(recMo, 1) : null,
      prob_1yr: round(p1, 4),
      prob_5yr: round(p5, 4),
      last_event_date: last ? last.slice(0, 10) : null,
      next_estimated: null,
      risk_level: risk,
      risk_color: risk,
      lat: round(lats.length ? mean(lats) : 0, 2),
      lon: round(lons.length ? mean(lons) : 0, 2),
    };
  });
  return {
    min_mag: minMag,
    catalog_coverage_years: 20.01,
    model: "stationary_poisson",
    disclaimer:
      "Illustrative Poisson model based on 2005–2025 historical records (M>=5.5). Not an earthquake prediction.",
    predictions: results,
  };
}

// ───────────────────────────── clusters (DBSCAN, haversine) ─────────────────────────────
const EARTH_RADIUS_KM = 6371.0088;
const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

/** DBSCAN with the haversine metric, same semantics as scikit-learn (core point = >= min_samples incl. itself). */
function dbscan(lat: Float64Array, lon: Float64Array, epsRad: number, minSamples: number): Int32Array {
  const n = lat.length;
  const cosLat = new Float64Array(n);
  for (let i = 0; i < n; i++) cosLat[i] = Math.cos(lat[i]);
  const thr = Math.sin(epsRad / 2) ** 2;
  const neighbors = (i: number) => {
    const out: number[] = [];
    for (let j = 0; j < n; j++) {
      const dLat = lat[j] - lat[i];
      const dLon = lon[j] - lon[i];
      const a = Math.sin(dLat / 2) ** 2 + cosLat[i] * cosLat[j] * Math.sin(dLon / 2) ** 2;
      if (a <= thr) out.push(j);
    }
    return out;
  };
  const labels = new Int32Array(n).fill(-2); // -2 = unvisited
  let cluster = -1;
  for (let i = 0; i < n; i++) {
    if (labels[i] !== -2) continue;
    const nb = neighbors(i);
    if (nb.length < minSamples) {
      labels[i] = -1;
      continue;
    }
    cluster++;
    labels[i] = cluster;
    const queue = nb.filter((j) => j !== i);
    for (let q = 0; q < queue.length; q++) {
      const j = queue[q];
      if (labels[j] === -1) labels[j] = cluster;
      if (labels[j] !== -2) continue;
      labels[j] = cluster;
      const nb2 = neighbors(j);
      if (nb2.length >= minSamples) for (const k of nb2) if (labels[k] === -2 || labels[k] === -1) queue.push(k);
    }
  }
  return labels;
}

export function clusters(qs: URLSearchParams) {
  let epsKm: number;
  if (qs.has("eps_km")) epsKm = parseBoundedFloat(qs.get("eps_km"), 150, 10, 3000);
  else if (qs.has("eps")) epsKm = parseBoundedFloat(qs.get("eps"), 2, 0.1, 30) * 111;
  else epsKm = 150;
  const minSamples = parseBoundedInt(qs.get("min_samples"), 5, 2, 50);
  const minMag = parseBoundedFloat(qs.get("min_mag"), 5.5, 0, 10);
  const limit = parseBoundedInt(qs.get("limit"), 3000, 1, 10000);

  let rows: {
    id: string; time: string; latitude: number; longitude: number; mag: number;
    depth: number; place: string; type: string; cluster: number;
  }[] = [];
  HISTORICAL.forEach((row, idx) => {
    const mag = pyFloat(row.mag), lat = pyFloat(row.latitude), lon = pyFloat(row.longitude), depth = pyFloat(row.depth);
    if (mag === null || lat === null || lon === null || depth === null) return;
    if (![mag, lat, lon, depth].every(Number.isFinite)) return;
    if (!(-90 <= lat && lat <= 90 && -180 <= lon && lon <= 180)) return;
    if (mag < minMag) return;
    rows.push({
      id: row.id || `cluster-pt-${idx}`,
      time: row.time || "",
      latitude: lat,
      longitude: lon,
      mag,
      depth,
      place: row.place ?? "Unknown",
      type: row.type || "earthquake",
      cluster: -1,
    });
  });
  rows = rows.slice(0, limit);

  const centroids: { cluster: number; name: string; count: number; lat: number; lon: number; avg_mag: number }[] = [];
  if (rows.length) {
    const latR = Float64Array.from(rows, (r) => toRad(r.latitude));
    const lonR = Float64Array.from(rows, (r) => toRad(r.longitude));
    const labels = dbscan(latR, lonR, epsKm / EARTH_RADIUS_KM, minSamples);
    rows.forEach((r, i) => (r.cluster = labels[i]));
    const unique = [...new Set(labels)].sort((a, b) => a - b);
    for (const lbl of unique) {
      const members = rows.filter((r) => r.cluster === lbl);
      if (!members.length) continue;
      let x = 0, y = 0, z = 0, magSum = 0;
      for (const m of members) {
        const la = toRad(m.latitude), lo = toRad(m.longitude);
        x += Math.cos(la) * Math.cos(lo);
        y += Math.cos(la) * Math.sin(lo);
        z += Math.sin(la);
        magSum += m.mag;
      }
      const c = members.length;
      const xm = x / c, ym = y / c, zm = z / c;
      const h = Math.hypot(xm, ym);
      const avgLon = h > 1e-7 ? toDeg(Math.atan2(ym, xm)) : 0;
      const avgLat = h > 1e-7 ? toDeg(Math.atan2(zm, h)) : zm > 0 ? 90 : -90;
      centroids.push({
        cluster: lbl,
        name: lbl === -1 ? "Noise" : `Cluster ${lbl + 1}`,
        count: c,
        lat: round(avgLat, 3),
        lon: round(avgLon, 3),
        avg_mag: round(magSum / c, 2),
      });
    }
  }
  const noise = centroids.find((c) => c.cluster === -1);
  return {
    n_clusters: centroids.filter((c) => c.cluster >= 0).length,
    n_noise: noise ? noise.count : 0,
    n_points: rows.length,
    centroids,
    data: rows,
    metric: "haversine",
    eps_km: epsKm,
    min_samples: minSamples,
  };
}

/** Wraps an endpoint: 400 on BadRequest, JSON + CORS otherwise. */
export async function handle(req: Request, fn: (qs: URLSearchParams) => unknown | Promise<unknown>) {
  try {
    return json(await fn(new URL(req.url).searchParams));
  } catch (err) {
    if (err instanceof BadRequest) return json({ error: err.message }, 400);
    return json({ error: "Internal error" }, 500);
  }
}

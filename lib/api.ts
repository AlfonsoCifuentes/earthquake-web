/* lib/api.ts — Typed fetch helpers for all API endpoints */

import type {
  RealtimeResponse,
  HistoricalResponse,
  AlertsResponse,
  PredictionsResponse,
  ClustersResponse,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    let errMessage = `API error ${res.status}: ${url}`;
    try {
      const errBody = await res.json();
      if (errBody && errBody.error) errMessage = errBody.error;
    } catch {
      // ignore
    }
    throw new Error(errMessage);
  }
  return res.json() as Promise<T>;
}

export interface RealtimeParams {
  min_mag?: number;
  max_mag?: number;
  limit?: number;
}

export async function fetchRealtime(
  params: RealtimeParams = {}
): Promise<RealtimeResponse> {
  const q = new URLSearchParams();
  if (params.min_mag !== undefined) q.set("min_mag", String(params.min_mag));
  if (params.max_mag !== undefined) q.set("max_mag", String(params.max_mag));
  if (params.limit !== undefined) q.set("limit", String(params.limit));
  return fetchJSON<RealtimeResponse>(`${BASE}/api/realtime?${q}`);
}

export interface HistoricalParams {
  min_mag?: number;
  max_mag?: number;
  min_depth?: number;
  max_depth?: number;
  start_date?: string;
  end_date?: string;
  region?: string;
  regions?: string[];
  limit?: number;
}

export async function fetchHistorical(
  params: HistoricalParams = {}
): Promise<HistoricalResponse> {
  const q = new URLSearchParams();
  if (params.min_mag !== undefined) q.set("min_mag", String(params.min_mag));
  if (params.max_mag !== undefined) q.set("max_mag", String(params.max_mag));
  if (params.min_depth !== undefined) q.set("min_depth", String(params.min_depth));
  if (params.max_depth !== undefined) q.set("max_depth", String(params.max_depth));
  if (params.start_date) q.set("start_date", params.start_date);
  if (params.end_date) q.set("end_date", params.end_date);
  if (params.limit !== undefined) q.set("limit", String(params.limit));

  // Multi-select region support
  if (params.regions && params.regions.length > 0) {
    for (const r of params.regions) {
      if (r && r !== "All") q.append("region", r);
    }
  } else if (params.region && params.region !== "All") {
    q.set("region", params.region);
  }

  return fetchJSON<HistoricalResponse>(`${BASE}/api/historical?${q}`);
}

export interface AlertsParams {
  feed?: "significant_week" | "m4.5_day" | "m2.5_hour";
  limit?: number;
}

export async function fetchAlerts(
  params: AlertsParams = {}
): Promise<AlertsResponse> {
  const q = new URLSearchParams();
  if (params.feed) q.set("feed", params.feed);
  if (params.limit) q.set("limit", String(params.limit));
  return fetchJSON<AlertsResponse>(`${BASE}/api/alerts?${q}`);
}

export async function fetchPredictions(
  min_mag = 7.0
): Promise<PredictionsResponse> {
  return fetchJSON<PredictionsResponse>(
    `${BASE}/api/predictions?min_mag=${min_mag}`
  );
}

export interface ClustersParams {
  eps_km?: number;
  eps?: number;
  min_samples?: number;
  min_mag?: number;
  limit?: number;
}

export async function fetchClusters(
  params: ClustersParams = {}
): Promise<ClustersResponse> {
  const q = new URLSearchParams();
  if (params.eps_km !== undefined) q.set("eps_km", String(params.eps_km));
  else if (params.eps !== undefined) q.set("eps", String(params.eps));
  if (params.min_samples !== undefined) q.set("min_samples", String(params.min_samples));
  if (params.min_mag !== undefined) q.set("min_mag", String(params.min_mag));
  if (params.limit !== undefined) q.set("limit", String(params.limit));

  return fetchJSON<ClustersResponse>(`${BASE}/api/clusters?${q}`);
}

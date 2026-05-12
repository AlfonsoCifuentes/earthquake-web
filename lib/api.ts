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
  if (!res.ok) throw new Error(`API error ${res.status}: ${url}`);
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
  limit?: number;
}

export async function fetchHistorical(
  params: HistoricalParams = {}
): Promise<HistoricalResponse> {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") q.set(k, String(v));
  });
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
  eps?: number;
  min_samples?: number;
  min_mag?: number;
  limit?: number;
}

export async function fetchClusters(
  params: ClustersParams = {}
): Promise<ClustersResponse> {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined) q.set(k, String(v));
  });
  return fetchJSON<ClustersResponse>(`${BASE}/api/clusters?${q}`);
}

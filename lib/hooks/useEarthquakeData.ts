"use client";
/* lib/hooks/useEarthquakeData.ts */
import { useQuery } from "@tanstack/react-query";
import {
  fetchRealtime,
  fetchHistorical,
  fetchAlerts,
  fetchPredictions,
  fetchClusters,
  type RealtimeParams,
  type HistoricalParams,
  type ClustersParams,
} from "../api";

export function useRealtimeData(params: RealtimeParams = {}) {
  return useQuery({
    queryKey: ["realtime", params],
    queryFn: () => fetchRealtime(params),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useHistoricalData(params: HistoricalParams) {
  return useQuery({
    queryKey: ["historical", params],
    queryFn: () => fetchHistorical(params),
    staleTime: 10 * 60 * 1000,
  });
}

export function useAlerts(
  feed: "significant_week" | "m4.5_day" | "m2.5_hour" = "significant_week"
) {
  return useQuery({
    queryKey: ["alerts", feed],
    queryFn: () => fetchAlerts({ feed, limit: 50 }),
    staleTime: 2 * 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  });
}

export function usePredictions(minMag = 7.0) {
  return useQuery({
    queryKey: ["predictions", minMag],
    queryFn: () => fetchPredictions(minMag),
    staleTime: 30 * 60 * 1000,
  });
}

export function useClusters(params: ClustersParams) {
  return useQuery({
    queryKey: ["clusters", params],
    queryFn: () => fetchClusters(params),
    staleTime: 15 * 60 * 1000,
  });
}

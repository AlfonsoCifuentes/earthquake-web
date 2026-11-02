/* lib/types.ts — Shared TypeScript types */

export interface Earthquake {
  id: string;
  time: string;
  mag: number;
  depth: number;
  latitude: number;
  longitude: number;
  place: string;
  type: string;
  status?: string;
  magType?: string;
  region?: string;
  url?: string;
}

export interface EarthquakeStats {
  total: number;
  avg_mag: number;
  max_mag: number;
  avg_depth: number;
  std_mag: number;
  region_counts: Record<string, number>;
  top_places: { place: string; count: number }[];
  mag_distribution: Record<string, number>;
}

export interface RealtimeResponse {
  count: number;
  source: string;
  fetched_at?: string;
  stale?: boolean;
  warning?: string | null;
  coverage?: {
    kind: string;
    start: string | null;
    end: string | null;
    minimum_magnitude: number;
    maximum_magnitude?: number;
  };
  data: Earthquake[];
}

export interface HistoricalResponse {
  stats: EarthquakeStats;
  data: Earthquake[];
  coverage?: {
    dataset: string;
    start: string;
    end: string;
    minimum_magnitude: number;
  };
}

export interface Alert extends Earthquake {
  alert: "critical" | "high" | "moderate" | "low";
  alert_color: string;
  age_hours: number;
  felt?: number;
  cdi?: number;
  mmi?: number;
  tsunami?: number;
}

export interface AlertsResponse {
  feed: string;
  source?: string;
  count: number;
  disclaimer?: string;
  summary: {
    critical: number;
    high: number;
    moderate: number;
    low: number;
  };
  data: Alert[];
}

export interface Prediction {
  region: string;
  n_events: number;
  events_per_year: number;
  recurrence_years: number | null;
  recurrence_months: number | null;
  prob_1yr: number;
  prob_5yr: number;
  last_event_date: string | null;
  next_estimated?: string | null;
  risk_level?: "critical" | "high" | "moderate" | "low" | string;
  risk_color: string;
  lat: number;
  lon: number;
}

export interface PredictionsResponse {
  min_mag: number;
  catalog_coverage_years?: number;
  model?: string;
  disclaimer?: string;
  predictions: Prediction[];
}

export interface ClusterPoint extends Earthquake {
  cluster: number;
}

export interface ClusterCentroid {
  cluster: number;
  name: string;
  count: number;
  lat: number;
  lon: number;
  avg_mag: number;
}

export interface ClustersResponse {
  n_clusters: number;
  n_noise: number;
  n_points: number;
  eps_km?: number;
  min_samples?: number;
  metric?: string;
  centroids: ClusterCentroid[];
  data: ClusterPoint[];
}

export interface FilterState {
  minMag: number;
  maxMag: number;
  minDepth: number;
  maxDepth: number;
  startDate: string;
  endDate: string;
  regions: string[];
  eventTypes: string[];
}

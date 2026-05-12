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
  data: Earthquake[];
}

export interface HistoricalResponse {
  stats: EarthquakeStats;
  data: Earthquake[];
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
  count: number;
  summary: Record<string, number>;
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
  next_estimated: string | null;
  risk_color: string;
  lat: number;
  lon: number;
}

export interface PredictionsResponse {
  min_mag: number;
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

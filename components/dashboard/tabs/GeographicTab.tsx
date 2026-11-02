"use client";
/* components/dashboard/tabs/GeographicTab.tsx */
import { useState, useMemo } from "react";
import { useRealtimeData } from "@/lib/hooks/useEarthquakeData";
import { useClusters } from "@/lib/hooks/useEarthquakeData";
import { useFilters } from "@/lib/hooks/useFilters";
import { MapSkeleton } from "@/components/ui/Skeleton";
import EventsMap from "@/components/maps/EventsMap";
import HeatMap from "@/components/maps/HeatMap";
import ClusterMap from "@/components/maps/ClusterMap";
import type { Earthquake } from "@/lib/types";

type SubTab = "events" | "heat" | "clusters";

function SubTabBtn({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
      style={{
        background: active ? "rgba(232,87,42,0.2)" : "rgba(255,255,255,0.04)",
        color: active ? "var(--primary)" : "rgba(240,237,232,0.45)",
        border: active ? "1px solid rgba(232,87,42,0.35)" : "1px solid var(--border)",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

export default function GeographicTab() {
  const [subTab, setSubTab] = useState<SubTab>("events");
  const [sliderEpsKm, setSliderEpsKm] = useState(150);
  const [sliderMinSamples, setSliderMinSamples] = useState(5);

  // Active query parameters (updated on clicking Run DBSCAN)
  const [activeParams, setActiveParams] = useState({
    epsKm: 150,
    minSamples: 5,
  });

  const { minMag, maxMag, minDepth, maxDepth, startDate, endDate } = useFilters();
  const { data: raw, isLoading } = useRealtimeData({
    min_mag: minMag,
    max_mag: maxMag,
    limit: 8000,
  });

  // Only query clusters when user switches to the clusters sub-tab
  const isClusterActive = subTab === "clusters";
  const {
    data: clusters,
    isLoading: clustersLoading,
    isFetching: clustersFetching,
    refetch: refetchClusters,
  } = useClusters(
    {
      eps_km: activeParams.epsKm,
      min_samples: activeParams.minSamples,
      min_mag: Math.max(minMag, 5.5),
      limit: 3000,
    },
    isClusterActive
  );

  const events: Earthquake[] = useMemo(() => {
    if (!raw?.data) return [];
    return raw.data.filter((e) => {
      if (e.depth < minDepth || e.depth > maxDepth) return false;
      if (startDate && e.time && e.time.slice(0, 10) < startDate) return false;
      if (endDate && e.time && e.time.slice(0, 10) > endDate) return false;
      return true;
    });
  }, [raw, minDepth, maxDepth, startDate, endDate]);

  const handleRunDBSCAN = () => {
    setActiveParams({
      epsKm: sliderEpsKm,
      minSamples: sliderMinSamples,
    });
    setTimeout(() => {
      refetchClusters();
    }, 0);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Sub-tabs */}
      <div className="flex gap-2">
        <SubTabBtn label="Events Map" active={subTab === "events"} onClick={() => setSubTab("events")} />
        <SubTabBtn label="Heat Map" active={subTab === "heat"} onClick={() => setSubTab("heat")} />
        <SubTabBtn label="Cluster Analysis" active={subTab === "clusters"} onClick={() => setSubTab("clusters")} />
      </div>

      {/* Content: Events */}
      {subTab === "events" && (
        <div className="glass rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          {isLoading ? (
            <MapSkeleton height={520} />
          ) : (
            <EventsMap data={events} height={520} />
          )}
          <div className="px-5 py-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs" style={{ color: "rgba(240,237,232,0.6)" }}>
              {events.length.toLocaleString()} events — CircleMarker size &amp; color by magnitude
            </p>
            <div className="flex items-center gap-3 text-xs" style={{ color: "rgba(240,237,232,0.7)" }}>
              <span style={{ color: "#0a84ff" }}>● &lt;M2</span>
              <span style={{ color: "#30d158" }}>● M2–4</span>
              <span style={{ color: "#ff9500" }}>● M4–6</span>
              <span style={{ color: "#ff3b30" }}>● M6–7</span>
              <span style={{ color: "#bf5af2" }}>● M7+</span>
            </div>
          </div>
        </div>
      )}

      {/* Content: Heat */}
      {subTab === "heat" && (
        <div className="glass rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          {isLoading ? (
            <MapSkeleton height={520} />
          ) : (
            <HeatMap data={events} height={520} />
          )}
          <div className="px-5 py-3">
            <p className="text-xs" style={{ color: "rgba(240,237,232,0.6)" }}>
              Density heatmap — kernel density weighted by seismic magnitude
            </p>
          </div>
        </div>
      )}

      {/* Content: Clusters */}
      {subTab === "clusters" && (
        <div className="flex flex-col gap-4">
          {/* Controls */}
          <div
            className="glass rounded-2xl p-5 flex flex-wrap items-end gap-6"
            style={{ border: "1px solid var(--border)" }}
          >
            <div>
              <label
                htmlFor="dbscan-eps-slider"
                className="block text-xs font-semibold uppercase tracking-widest mb-2"
                style={{ color: "rgba(240,237,232,0.6)" }}
              >
                Distance threshold (ε): {sliderEpsKm} km
              </label>
              <input
                id="dbscan-eps-slider"
                type="range"
                min={25}
                max={800}
                step={25}
                value={sliderEpsKm}
                onChange={(e) => setSliderEpsKm(parseFloat(e.target.value))}
                className="w-48"
                style={{ accentColor: "var(--primary)" }}
                aria-label="DBSCAN Haversine distance threshold in kilometers"
              />
            </div>
            <div>
              <label
                htmlFor="dbscan-min-samples"
                className="block text-xs font-semibold uppercase tracking-widest mb-2"
                style={{ color: "rgba(240,237,232,0.6)" }}
              >
                Min samples: {sliderMinSamples}
              </label>
              <input
                id="dbscan-min-samples"
                type="range"
                min={2}
                max={20}
                step={1}
                value={sliderMinSamples}
                onChange={(e) => setSliderMinSamples(parseInt(e.target.value, 10))}
                className="w-48"
                style={{ accentColor: "var(--primary)" }}
                aria-label="DBSCAN minimum samples per cluster"
              />
            </div>
            <button
              onClick={handleRunDBSCAN}
              disabled={clustersFetching}
              className="px-5 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: "var(--primary)",
                color: "#fff",
                border: "none",
                cursor: clustersFetching ? "wait" : "pointer",
                boxShadow: "0 0 18px rgba(232,87,42,0.4)",
                opacity: clustersFetching ? 0.7 : 1,
              }}
            >
              {clustersFetching ? "Computing DBSCAN..." : "Run DBSCAN"}
            </button>
            {clusters && (
              <div style={{ color: "rgba(240,237,232,0.75)", fontSize: 13 }}>
                Found {clusters.n_clusters} clusters · {clusters.n_noise} noise points
              </div>
            )}
          </div>

          <p className="text-xs px-2" style={{ color: "rgba(240,237,232,0.5)" }}>
            Spatial grouping via DBSCAN with great-circle Haversine distance. Identifies geographic clusters, not earthquake predictions.
          </p>

          {/* Map */}
          <div className="glass rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            {clustersLoading ? (
              <MapSkeleton height={500} />
            ) : clusters && clusters.data && clusters.data.length > 0 ? (
              <ClusterMap
                points={clusters.data}
                centroids={clusters.centroids}
                height={500}
              />
            ) : (
              <div
                className="flex items-center justify-center p-8"
                style={{ height: 500, color: "rgba(240,237,232,0.5)" }}
              >
                No cluster points matching current parameters. Adjust distance threshold or minimum samples above and click Run DBSCAN.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

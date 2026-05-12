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
  const [eps, setEps] = useState(2.5);
  const [minSamples, setMinSamples] = useState(5);

  const { minMag, maxMag, minDepth, maxDepth } = useFilters();
  const { data: raw, isLoading } = useRealtimeData({ min_mag: minMag, max_mag: maxMag, limit: 8000 });
  const { data: clusters, isLoading: clustersLoading, refetch: refetchClusters } = useClusters({
    eps,
    min_samples: minSamples,
    min_mag: minMag,
    limit: 3000,
  });

  const events: Earthquake[] = useMemo(() => {
    if (!raw?.data) return [];
    return raw.data.filter((e) => e.depth >= minDepth && e.depth <= maxDepth);
  }, [raw, minDepth, maxDepth]);

  return (
    <div className="flex flex-col gap-5">
      {/* Sub-tabs */}
      <div className="flex gap-2">
        <SubTabBtn label="Events Map"   active={subTab === "events"}   onClick={() => setSubTab("events")} />
        <SubTabBtn label="Heat Map"     active={subTab === "heat"}     onClick={() => setSubTab("heat")} />
        <SubTabBtn label="Cluster Analysis" active={subTab === "clusters"} onClick={() => setSubTab("clusters")} />
      </div>

      {/* Content */}
      {subTab === "events" && (
        <div className="glass rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          {isLoading ? (
            <MapSkeleton height={520} />
          ) : (
            <EventsMap data={events} height={520} />
          )}
          <div className="px-5 py-3 flex items-center justify-between">
            <p className="text-xs" style={{ color: "rgba(240,237,232,0.4)" }}>
              {events.length.toLocaleString()} events — CircleMarker size/color by magnitude
            </p>
            <div className="flex items-center gap-3 text-xs" style={{ color: "rgba(240,237,232,0.4)" }}>
              <span style={{ color: "#0a84ff" }}>● &lt;M2</span>
              <span style={{ color: "#30d158" }}>● M2-4</span>
              <span style={{ color: "#ff9500" }}>● M4-6</span>
              <span style={{ color: "#ff3b30" }}>● M6-7</span>
              <span style={{ color: "#bf5af2" }}>● M7+</span>
            </div>
          </div>
        </div>
      )}

      {subTab === "heat" && (
        <div className="glass rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          {isLoading ? (
            <MapSkeleton height={520} />
          ) : (
            <HeatMap data={events} height={520} />
          )}
          <div className="px-5 py-3">
            <p className="text-xs" style={{ color: "rgba(240,237,232,0.4)" }}>
              Density heatmap — weight proportional to magnitude
            </p>
          </div>
        </div>
      )}

      {subTab === "clusters" && (
        <div className="flex flex-col gap-4">
          {/* Controls */}
          <div
            className="glass rounded-2xl p-5 flex flex-wrap items-end gap-6"
            style={{ border: "1px solid var(--border)" }}
          >
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-widest mb-2"
                style={{ color: "rgba(240,237,232,0.35)" }}
              >
                Epsilon (ε): {eps}°
              </label>
              <input
                type="range"
                min={0.5}
                max={8}
                step={0.5}
                value={eps}
                onChange={(e) => setEps(parseFloat(e.target.value))}
                className="w-48"
                style={{ accentColor: "var(--primary)" }}
              />
            </div>
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-widest mb-2"
                style={{ color: "rgba(240,237,232,0.35)" }}
              >
                Min samples: {minSamples}
              </label>
              <input
                type="range"
                min={2}
                max={20}
                step={1}
                value={minSamples}
                onChange={(e) => setMinSamples(parseInt(e.target.value))}
                className="w-48"
                style={{ accentColor: "var(--primary)" }}
              />
            </div>
            <button
              onClick={() => refetchClusters()}
              className="px-5 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: "var(--primary)",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 0 18px rgba(232,87,42,0.4)",
              }}
            >
              Run DBSCAN
            </button>
            {clusters && (
              <div style={{ color: "rgba(240,237,232,0.5)", fontSize: 13 }}>
                {clusters.n_clusters} clusters · {clusters.n_noise} noise points
              </div>
            )}
          </div>

          {/* Map */}
          <div className="glass rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            {clustersLoading ? (
              <MapSkeleton height={500} />
            ) : clusters ? (
              <ClusterMap
                points={clusters.data}
                centroids={clusters.centroids}
                height={500}
              />
            ) : (
              <div
                className="flex items-center justify-center"
                style={{ height: 500, color: "rgba(240,237,232,0.3)" }}
              >
                Configure parameters above and click Run DBSCAN
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

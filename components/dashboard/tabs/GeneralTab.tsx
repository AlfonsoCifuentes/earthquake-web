"use client";
/* components/dashboard/tabs/GeneralTab.tsx */
import { useMemo } from "react";
import { useRealtimeData } from "@/lib/hooks/useEarthquakeData";
import { useFilters } from "@/lib/hooks/useFilters";
import MetricCard from "@/components/ui/MetricCard";
import { ChartSkeleton } from "@/components/ui/Skeleton";
import MagnitudeHistogram from "@/components/charts/MagnitudeHistogram";
import DepthDistribution from "@/components/charts/DepthDistribution";
import MagDepthScatter from "@/components/charts/MagDepthScatter";
import TopRegionsBar from "@/components/charts/TopRegionsBar";
import type { Earthquake } from "@/lib/types";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-sm font-semibold uppercase tracking-widest mb-4"
      style={{ color: "rgba(240,237,232,0.35)", letterSpacing: "0.12em" }}
    >
      {children}
    </h2>
  );
}

function CardWrap({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="glass rounded-2xl p-5"
      style={{ border: "1px solid var(--border)" }}
    >
      <h3
        className="text-sm font-semibold mb-4"
        style={{ color: "rgba(240,237,232,0.5)" }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

export default function GeneralTab() {
  const { minMag, maxMag, minDepth, maxDepth } = useFilters();
  const { data: raw, isLoading, isError } = useRealtimeData({
    min_mag: minMag,
    max_mag: maxMag,
    limit: 10000,
  });

  const events: Earthquake[] = useMemo(() => {
    if (!raw?.data) return [];
    return raw.data.filter(
      (e) => e.depth >= minDepth && e.depth <= maxDepth
    );
  }, [raw, minDepth, maxDepth]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <ChartSkeleton key={i} height={200} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64">
        <p style={{ color: "var(--primary)" }}>Error loading data. Check API connection.</p>
      </div>
    );
  }

  const total = events.length;
  const avgMag = total ? events.reduce((s, e) => s + e.mag, 0) / total : 0;
  const maxMagVal = total ? Math.max(...events.map((e) => e.mag)) : 0;
  const avgDepth = total ? events.reduce((s, e) => s + e.depth, 0) / total : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Metric cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          label="Total Events"
          value={total}
          icon="◎"
          color="#00d4ff"
        />
        <MetricCard
          label="Avg Magnitude"
          value={avgMag}
          decimals={2}
          icon="◈"
          color="#e8572a"
        />
        <MetricCard
          label="Max Magnitude"
          value={maxMagVal}
          decimals={1}
          icon="▲"
          color="#ff3b30"
        />
        <MetricCard
          label="Avg Depth"
          value={avgDepth}
          decimals={1}
          unit=" km"
          icon="▼"
          color="#ff9500"
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CardWrap title="Magnitude Distribution">
          <MagnitudeHistogram data={events} />
        </CardWrap>
        <CardWrap title="Depth Distribution">
          <DepthDistribution data={events} />
        </CardWrap>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CardWrap title="Magnitude vs Depth">
          <MagDepthScatter data={events} />
        </CardWrap>
        <CardWrap title="Top Regions">
          <TopRegionsBar data={events} />
        </CardWrap>
      </div>

      {/* Data table */}
      <div
        className="glass rounded-2xl p-5"
        style={{ border: "1px solid var(--border)" }}
      >
        <SectionTitle>Recent events</SectionTitle>
        <div className="overflow-x-auto">
          <table className="data-table w-full text-sm">
            <thead>
              <tr>
                <th>Time (UTC)</th>
                <th>Place</th>
                <th>Mag</th>
                <th>Depth</th>
                <th>Lat</th>
                <th>Lon</th>
              </tr>
            </thead>
            <tbody>
              {events.slice(0, 50).map((e, i) => (
                <tr key={e.id || i}>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
                    {e.time?.slice(0, 19).replace("T", " ")}
                  </td>
                  <td>{e.place}</td>
                  <td>
                    <span
                      className="mag-badge"
                      data-mag={Math.floor(e.mag)}
                      style={{ fontWeight: 700 }}
                    >
                      M {e.mag.toFixed(1)}
                    </span>
                  </td>
                  <td>{e.depth?.toFixed(1)} km</td>
                  <td>{e.latitude?.toFixed(2)}</td>
                  <td>{e.longitude?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {events.length > 50 && (
          <p className="text-xs mt-3" style={{ color: "rgba(240,237,232,0.3)" }}>
            Showing 50 of {events.length} events. Apply filters to narrow results.
          </p>
        )}
      </div>
    </div>
  );
}

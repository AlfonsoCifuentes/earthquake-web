"use client";
/* components/dashboard/tabs/GeneralTab.tsx */
import { useMemo, useState } from "react";
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
      style={{ color: "rgba(240,237,232,0.6)", letterSpacing: "0.12em" }}
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
        style={{ color: "rgba(240,237,232,0.7)" }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

type SortField = "time" | "place" | "mag" | "depth";
type SortOrder = "asc" | "desc";

export default function GeneralTab() {
  const { minMag, maxMag, minDepth, maxDepth, startDate, endDate, regions } = useFilters();
  const { data: raw, isLoading, isError } = useRealtimeData({
    min_mag: minMag,
    max_mag: maxMag,
    limit: 10000,
  });

  const [sortField, setSortField] = useState<SortField>("time");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const events: Earthquake[] = useMemo(() => {
    if (!raw?.data) return [];
    return raw.data.filter((e) => {
      if (e.depth < minDepth || e.depth > maxDepth) return false;
      if (startDate && e.time && e.time.slice(0, 10) < startDate) return false;
      if (endDate && e.time && e.time.slice(0, 10) > endDate) return false;
      if (regions && regions.length > 0) {
        const placeLower = (e.place || "").toLowerCase();
        const matchesAnyRegion = regions.some((r) => {
          if (r === "Ring of Fire") {
            return ["japan", "indonesia", "philippines", "chile", "peru", "mexico", "alaska", "tonga", "vanuatu", "fiji", "solomon", "kermadec", "new zealand"].some((k) => placeLower.includes(k));
          } else if (r === "Alpine-Himalayan Belt") {
            return ["turkey", "greece", "italy", "iran", "pakistan", "india", "nepal", "afghanistan", "caucasus"].some((k) => placeLower.includes(k));
          } else if (r === "Mid-Atlantic Ridge") {
            return ["atlantic", "azores", "iceland"].some((k) => placeLower.includes(k));
          }
          return false;
        });
        if (!matchesAnyRegion) return false;
      }
      return true;
    });
  }, [raw, minDepth, maxDepth, startDate, endDate, regions]);

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      let cmp = 0;
      if (sortField === "time") {
        cmp = (a.time || "").localeCompare(b.time || "");
      } else if (sortField === "place") {
        cmp = (a.place || "").localeCompare(b.place || "");
      } else if (sortField === "mag") {
        cmp = (a.mag || 0) - (b.mag || 0);
      } else if (sortField === "depth") {
        cmp = (a.depth || 0) - (b.depth || 0);
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });
  }, [events, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

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
      <div className="glass rounded-2xl p-8 text-center flex flex-col items-center justify-center h-64">
        <p style={{ color: "var(--primary)", fontWeight: 600 }}>Error loading live seismic feed.</p>
        <p className="text-xs mt-2" style={{ color: "rgba(240,237,232,0.6)" }}>
          The USGS service may be temporarily unreachable. Please check your connection or retry in a moment.
        </p>
      </div>
    );
  }

  const total = events.length;
  const avgMag = total ? events.reduce((s, e) => s + e.mag, 0) / total : 0;
  const maxMagVal = total ? Math.max(...events.map((e) => e.mag)) : 0;
  const avgDepth = total ? events.reduce((s, e) => s + e.depth, 0) / total : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Degraded warning if any */}
      {raw?.stale && (
        <div
          className="rounded-xl px-4 py-2.5 text-xs flex items-center justify-between"
          style={{
            background: "rgba(255, 149, 0, 0.12)",
            border: "1px solid rgba(255, 149, 0, 0.35)",
            color: "#ff9500",
          }}
        >
          <span>{raw.warning || "USGS feed currently using cached local snapshot."}</span>
        </div>
      )}

      {/* Scope banner */}
      <div
        className="rounded-xl px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2"
        style={{
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid var(--border)",
          color: "rgba(240, 237, 232, 0.65)",
        }}
      >
        <span>Feed: USGS Rolling 30-Day Global Events</span>
        <span>Showing {total.toLocaleString()} filtered events</span>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          label="Total Events (30d)"
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
        <CardWrap title="Top Named Locations">
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
                <th
                  onClick={() => handleSort("time")}
                  style={{ cursor: "pointer" }}
                  aria-sort={sortField === "time" ? (sortOrder === "asc" ? "ascending" : "descending") : "none"}
                >
                  Time (UTC) {sortField === "time" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                </th>
                <th
                  onClick={() => handleSort("place")}
                  style={{ cursor: "pointer" }}
                  aria-sort={sortField === "place" ? (sortOrder === "asc" ? "ascending" : "descending") : "none"}
                >
                  Place {sortField === "place" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                </th>
                <th
                  onClick={() => handleSort("mag")}
                  style={{ cursor: "pointer" }}
                  aria-sort={sortField === "mag" ? (sortOrder === "asc" ? "ascending" : "descending") : "none"}
                >
                  Mag {sortField === "mag" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                </th>
                <th
                  onClick={() => handleSort("depth")}
                  style={{ cursor: "pointer" }}
                  aria-sort={sortField === "depth" ? (sortOrder === "asc" ? "ascending" : "descending") : "none"}
                >
                  Depth {sortField === "depth" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                </th>
                <th>Lat</th>
                <th>Lon</th>
              </tr>
            </thead>
            <tbody>
              {sortedEvents.slice(0, 50).map((e, i) => (
                <tr key={e.id || i}>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
                    {e.time?.slice(0, 19).replace("T", " ")}
                  </td>
                  <td>{e.place}</td>
                  <td>
                    <span
                      className="mag-badge"
                      data-mag={Math.floor(e.mag || 0)}
                      style={{ fontWeight: 700 }}
                    >
                      M {(e.mag || 0).toFixed(1)}
                    </span>
                  </td>
                  <td>{e.depth != null ? `${e.depth.toFixed(1)} km` : "—"}</td>
                  <td>{e.latitude != null ? e.latitude.toFixed(2) : "—"}</td>
                  <td>{e.longitude != null ? e.longitude.toFixed(2) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {events.length > 50 && (
          <p className="text-xs mt-3" style={{ color: "rgba(240,237,232,0.5)" }}>
            Showing top 50 of {events.length.toLocaleString()} events sorted by {sortField}.
          </p>
        )}
      </div>
    </div>
  );
}

"use client";
/* components/dashboard/tabs/HistoricalTab.tsx */
import { useState, useMemo } from "react";
import { useHistoricalData, usePredictions } from "@/lib/hooks/useEarthquakeData";
import { useFilters } from "@/lib/hooks/useFilters";
import { ChartSkeleton, MapSkeleton } from "@/components/ui/Skeleton";
import MetricCard from "@/components/ui/MetricCard";
import MagnitudePie from "@/components/charts/MagnitudePie";
import TopRegionsBar from "@/components/charts/TopRegionsBar";
import TimeSeriesBar from "@/components/charts/TimeSeriesBar";
import HourlyHeatmap from "@/components/charts/HourlyHeatmap";
import Scatter3D from "@/components/charts/Scatter3D";
import MagDepthScatter from "@/components/charts/MagDepthScatter";
import RiskForecastMap from "@/components/maps/RiskForecastMap";
import EventsMap from "@/components/maps/EventsMap";
import { formatProbability } from "@/lib/format";
import type { Earthquake } from "@/lib/types";

type SubTab = "overview" | "distribution" | "patterns" | "recurrence";

const SUB_TABS: { id: SubTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "distribution", label: "Global Distribution" },
  { id: "patterns", label: "Time Patterns" },
  { id: "recurrence", label: "Recurrence (Poisson)" },
];

function SubTabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
      style={{
        background: active ? "rgba(0,212,255,0.15)" : "rgba(255,255,255,0.04)",
        color: active ? "#00d4ff" : "rgba(240,237,232,0.6)",
        border: active ? "1px solid rgba(0,212,255,0.3)" : "1px solid var(--border)",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

function CardWrap({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl p-5" style={{ border: "1px solid var(--border)" }}>
      <h3 className="text-sm font-semibold mb-4" style={{ color: "rgba(240,237,232,0.7)" }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

export default function HistoricalTab() {
  const [subTab, setSubTab] = useState<SubTab>("overview");
  const { minMag, maxMag, minDepth, maxDepth, startDate, endDate, regions } = useFilters();

  const { data: raw, isLoading } = useHistoricalData({
    min_mag: minMag,
    max_mag: maxMag,
    min_depth: minDepth,
    max_depth: maxDepth,
    start_date: startDate,
    end_date: endDate,
    regions: regions.length > 0 ? regions : undefined,
    limit: 10000,
  });

  const isRecurrenceActive = subTab === "recurrence";
  const { data: predictions, isLoading: predLoading } = usePredictions(
    Math.max(minMag, 5.5)
  );

  const events: Earthquake[] = raw?.data ?? [];

  return (
    <div className="flex flex-col gap-5">
      {/* Sub-tabs */}
      <div className="flex gap-2 flex-wrap">
        {SUB_TABS.map((t) => (
          <SubTabBtn
            key={t.id}
            label={t.label}
            active={subTab === t.id}
            onClick={() => setSubTab(t.id)}
          />
        ))}
      </div>

      {/* --- Overview --- */}
      {subTab === "overview" && (
        <>
          {isLoading ? (
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <ChartSkeleton key={i} height={120} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              <MetricCard label="Total Historical (M≥5.5)" value={events.length} icon="◎" color="#00d4ff" />
              <MetricCard
                label="Avg Magnitude"
                value={events.length ? events.reduce((s, e) => s + e.mag, 0) / events.length : 0}
                decimals={2}
                icon="◈"
                color="#e8572a"
              />
              <MetricCard
                label="Max Magnitude"
                value={events.length ? Math.max(...events.map((e) => e.mag)) : 0}
                decimals={1}
                icon="▲"
                color="#ff3b30"
              />
              <MetricCard
                label="Avg Depth"
                value={events.length ? events.reduce((s, e) => s + e.depth, 0) / events.length : 0}
                decimals={1}
                unit=" km"
                icon="▼"
                color="#ff9500"
              />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <CardWrap title="Magnitude Distribution (M≥5.5)">
              {isLoading ? <ChartSkeleton height={320} /> : <MagnitudePie data={events} />}
            </CardWrap>
            <CardWrap title="Top Named Locations">
              {isLoading ? <ChartSkeleton height={320} /> : <TopRegionsBar data={events} />}
            </CardWrap>
          </div>

          {/* Stats card */}
          {raw?.stats && !isLoading && (
            <div className="glass rounded-2xl p-5" style={{ border: "1px solid var(--border)" }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: "rgba(240,237,232,0.7)" }}>
                Regional Event Distribution
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(raw.stats.region_counts ?? {}).map(([region, count]) => (
                  <div
                    key={region}
                    className="rounded-xl p-4 text-center"
                    style={{ background: "rgba(0,212,255,0.06)", border: "1px solid rgba(0,212,255,0.15)" }}
                  >
                    <p className="text-xs mb-2" style={{ color: "rgba(240,237,232,0.6)" }}>
                      {region}
                    </p>
                    <p className="text-xl font-bold" style={{ color: "#00d4ff" }}>
                      {(count as number).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* --- Distribution --- */}
      {subTab === "distribution" && (
        <div className="flex flex-col gap-5">
          <div className="glass rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            {isLoading ? (
              <MapSkeleton height={520} />
            ) : (
              <EventsMap data={events} height={520} />
            )}
            <div className="px-5 py-3">
              <p className="text-xs" style={{ color: "rgba(240,237,232,0.6)" }}>
                {events.length.toLocaleString()} historical events (2005–2025, M≥5.5) — size &amp; color-coded by magnitude
              </p>
            </div>
          </div>

          <CardWrap title="Top Named Locations by Event Count">
            {isLoading ? <ChartSkeleton height={340} /> : <TopRegionsBar data={events} />}
          </CardWrap>
        </div>
      )}

      {/* --- Time Patterns --- */}
      {subTab === "patterns" && (
        <div className="flex flex-col gap-5">
          <CardWrap title="Daily Evolution (2005–2025)">
            {isLoading ? <ChartSkeleton height={360} /> : <TimeSeriesBar data={events} />}
          </CardWrap>
          <CardWrap title="Hourly Activity Patterns (UTC)">
            {isLoading ? <ChartSkeleton height={500} /> : <HourlyHeatmap data={events} />}
          </CardWrap>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <CardWrap title="3D View: Year × Magnitude × Depth">
              {isLoading ? <ChartSkeleton height={460} /> : <Scatter3D data={events} />}
            </CardWrap>
            <CardWrap title="Magnitude vs Depth">
              {isLoading ? <ChartSkeleton height={360} /> : <MagDepthScatter data={events} />}
            </CardWrap>
          </div>
        </div>
      )}

      {/* --- Recurrence (Poisson Model) --- */}
      {subTab === "recurrence" && (
        <div className="flex flex-col gap-5">
          {/* Scientific Disclaimer */}
          <div
            className="rounded-2xl p-4 text-xs leading-relaxed"
            style={{
              background: "rgba(0, 212, 255, 0.08)",
              border: "1px solid rgba(0, 212, 255, 0.25)",
              color: "rgba(240, 237, 232, 0.85)",
            }}
          >
            <strong style={{ color: "#00d4ff" }}>Scientific Note on Recurrence:</strong> Illustrative Poisson recurrence model based on 2005–2025 historical records (M≥5.5). This is <strong>not</strong> an earthquake prediction or official hazard assessment. The Poisson model assumes seismic events occur independently at a constant average regional rate; past intervals do not predict future event dates or epicenters.
          </div>

          {/* Predictions table */}
          <div className="glass rounded-2xl p-5" style={{ border: "1px solid var(--border)" }}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: "rgba(240,237,232,0.7)" }}>
              Historical Event Recurrence Analysis by Region
            </h3>
            {predLoading ? (
              <ChartSkeleton height={240} />
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table w-full text-sm">
                  <thead>
                    <tr>
                      <th>Region</th>
                      <th>Events/yr</th>
                      <th>Mean Interval</th>
                      <th>1-Yr Prob (Poisson)</th>
                      <th>5-Yr Prob (Poisson)</th>
                      <th>Last Recorded Event</th>
                      <th>Frequency Band</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(predictions?.predictions ?? []).map((p) => {
                      const level = p.risk_level || p.risk_color || "low";
                      const color =
                        level === "critical" ? "#ff3b30" :
                        level === "high" ? "#ff9500" :
                        level === "moderate" ? "#ffd60a" :
                        "#30d158";

                      return (
                        <tr key={p.region}>
                          <td className="font-medium" style={{ color: "var(--text)" }}>{p.region}</td>
                          <td>{p.events_per_year.toFixed(2)}</td>
                          <td>{p.recurrence_months != null ? `${p.recurrence_months.toFixed(1)} mo` : "—"}</td>
                          <td>
                            <span style={{ color, fontWeight: 700 }}>
                              {formatProbability(p.prob_1yr)}
                            </span>
                          </td>
                          <td>{formatProbability(p.prob_5yr)}</td>
                          <td style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
                            {p.last_event_date || "—"}
                          </td>
                          <td>
                            <span
                              className="inline-flex px-2 py-0.5 rounded-md text-xs font-semibold"
                              style={{
                                background: `${color}20`,
                                color: color,
                                border: `1px solid ${color}40`,
                                textTransform: "uppercase",
                              }}
                            >
                              {level}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recurrence map */}
          <div className="glass rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            <div className="px-5 pt-4 pb-2">
              <h3 className="text-sm font-semibold" style={{ color: "rgba(240,237,232,0.7)" }}>
                Historical Recurrence Overview
              </h3>
              <p className="text-xs mt-1" style={{ color: "rgba(240,237,232,0.5)" }}>
                Circle color &amp; radius represent Poisson 1-year event recurrence probability across tectonic domains
              </p>
            </div>
            {predLoading ? (
              <MapSkeleton height={460} />
            ) : (
              <RiskForecastMap predictions={predictions?.predictions ?? []} height={460} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

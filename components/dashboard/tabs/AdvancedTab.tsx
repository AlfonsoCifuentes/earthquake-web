"use client";
/* components/dashboard/tabs/AdvancedTab.tsx */
import { useMemo } from "react";
import { useHistoricalData } from "@/lib/hooks/useEarthquakeData";
import { useFilters } from "@/lib/hooks/useFilters";
import { ChartSkeleton } from "@/components/ui/Skeleton";
import CorrelationMatrix from "@/components/charts/CorrelationMatrix";
import RegressionScatter from "@/components/charts/RegressionScatter";
import TopRegionsBar from "@/components/charts/TopRegionsBar";
import MagnitudePie from "@/components/charts/MagnitudePie";
import type { Earthquake } from "@/lib/types";

function CardWrap({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl p-5" style={{ border: "1px solid var(--border)" }}>
      <div className="mb-4">
        <h3 className="text-sm font-semibold" style={{ color: "rgba(240,237,232,0.7)" }}>
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs mt-1" style={{ color: "rgba(240,237,232,0.45)" }}>
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

export default function AdvancedTab() {
  const { minMag, maxMag, minDepth, maxDepth, startDate, endDate, regions } = useFilters();
  const { data: raw, isLoading } = useHistoricalData({
    min_mag: minMag,
    max_mag: maxMag,
    min_depth: minDepth,
    max_depth: maxDepth,
    start_date: startDate,
    end_date: endDate,
    regions: regions.length > 0 ? regions : undefined,
    limit: 8000,
  });

  const events: Earthquake[] = raw?.data ?? [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <ChartSkeleton key={i} height={360} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Notice on dataset */}
      <div
        className="rounded-xl px-4 py-2.5 text-xs flex items-center justify-between"
        style={{
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid var(--border)",
          color: "rgba(240, 237, 232, 0.65)",
        }}
      >
        <span>Historical Catalog Analysis (2005–2025, M≥5.5)</span>
        <span>{events.length.toLocaleString()} matching events</span>
      </div>

      {/* Row 1: correlation + pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CardWrap
          title="Correlation Matrix"
          subtitle="Pearson r between magnitude, depth, latitude, longitude"
        >
          <CorrelationMatrix data={events} />
        </CardWrap>

        <CardWrap title="Magnitude Category Distribution">
          <MagnitudePie data={events} />
        </CardWrap>
      </div>

      {/* Row 2: regression + top regions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CardWrap
          title="Magnitude vs Depth Regression"
          subtitle="Ordinary least squares trend line (M vs Depth)"
        >
          <RegressionScatter data={events} />
        </CardWrap>

        <CardWrap title="Top Named Locations by Event Count">
          <TopRegionsBar data={events} />
        </CardWrap>
      </div>

      {/* Stats summary */}
      {raw?.stats && (
        <div
          className="glass rounded-2xl p-5"
          style={{ border: "1px solid var(--border)" }}
        >
          <h3
            className="text-sm font-semibold mb-4"
            style={{ color: "rgba(240,237,232,0.7)" }}
          >
            Statistical Summary
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Avg Magnitude", value: raw.stats.total ? raw.stats.avg_mag?.toFixed(2) : "—" },
              { label: "Max Magnitude", value: raw.stats.total ? raw.stats.max_mag?.toFixed(1) : "—" },
              { label: "Avg Depth", value: raw.stats.total ? `${raw.stats.avg_depth?.toFixed(1)} km` : "—" },
              { label: "Events", value: raw.stats.total?.toLocaleString() ?? "0" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl p-4 text-center"
                style={{
                  background: "rgba(232,87,42,0.07)",
                  border: "1px solid rgba(232,87,42,0.15)",
                }}
              >
                <p className="text-xs mb-1" style={{ color: "rgba(240,237,232,0.6)" }}>
                  {item.label}
                </p>
                <p className="text-lg font-bold" style={{ color: "var(--primary)" }}>
                  {item.value ?? "—"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

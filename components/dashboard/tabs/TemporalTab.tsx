"use client";
/* components/dashboard/tabs/TemporalTab.tsx */
import { useMemo } from "react";
import { useRealtimeData } from "@/lib/hooks/useEarthquakeData";
import { useFilters } from "@/lib/hooks/useFilters";
import { ChartSkeleton } from "@/components/ui/Skeleton";
import TimeSeriesBar from "@/components/charts/TimeSeriesBar";
import WeeklyHeatmap from "@/components/charts/WeeklyHeatmap";
import HourlyHeatmap from "@/components/charts/HourlyHeatmap";
import type { Earthquake } from "@/lib/types";

function CardWrap({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl p-5" style={{ border: "1px solid var(--border)" }}>
      <div className="mb-4">
        <h3 className="text-sm font-semibold" style={{ color: "rgba(240,237,232,0.5)" }}>
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs mt-1" style={{ color: "rgba(240,237,232,0.25)" }}>
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

export default function TemporalTab() {
  const { minMag, maxMag, minDepth, maxDepth } = useFilters();
  const { data: raw, isLoading } = useRealtimeData({ min_mag: minMag, max_mag: maxMag, limit: 10000 });

  const events: Earthquake[] = useMemo(() => {
    if (!raw?.data) return [];
    return raw.data.filter((e) => e.depth >= minDepth && e.depth <= maxDepth);
  }, [raw, minDepth, maxDepth]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5">
        <ChartSkeleton height={360} />
        <ChartSkeleton height={420} />
        <ChartSkeleton height={500} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <CardWrap
        title="Daily Event Evolution"
        subtitle="Event count per day with 7-day moving average"
      >
        <TimeSeriesBar data={events} />
      </CardWrap>

      <CardWrap
        title="Weekly Patterns"
        subtitle="Event density by week and day of week"
      >
        <WeeklyHeatmap data={events} />
      </CardWrap>

      <CardWrap
        title="Hourly Patterns"
        subtitle="Event distribution by UTC hour and day of week"
      >
        <HourlyHeatmap data={events} />
      </CardWrap>
    </div>
  );
}

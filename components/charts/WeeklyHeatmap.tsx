"use client";
/* components/charts/WeeklyHeatmap.tsx */
import { useMemo } from "react";
import PlotlyChart from "./PlotlyChart";
import type { Earthquake } from "@/lib/types";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function WeeklyHeatmap({ data }: { data: Earthquake[] }) {
  const { z, yLabels } = useMemo(() => {
    if (!data.length) return { z: [], yLabels: [] };

    // Group by ISO week (UTC based)
    const weekDayMap: Record<number, number[]> = {};
    const refStart = new Date("2005-01-03T00:00:00Z").getTime();

    for (const eq of data) {
      if (!eq.time) continue;
      const d = new Date(eq.time);
      if (isNaN(d.getTime())) continue;

      const weekNum = Math.floor((d.getTime() - refStart) / (7 * 86400000));
      // UTC day of week (Monday = 0, Sunday = 6)
      const dow = (d.getUTCDay() + 6) % 7;
      (weekDayMap[weekNum] ??= Array(7).fill(0))[dow]++;
    }

    const sortedWeekNums = Object.keys(weekDayMap)
      .map((k) => parseInt(k, 10))
      .sort((a, b) => a - b);

    // Limit to latest 52 weeks if many weeks exist to keep heatmap legible
    const recentWeeks = sortedWeekNums.slice(-52);
    const zMatrix = recentWeeks.map((w) => weekDayMap[w]);
    const labels = recentWeeks.map((w) => {
      const startMs = refStart + w * 7 * 86400000;
      return new Date(startMs).toISOString().slice(0, 10);
    });

    return { z: zMatrix, yLabels: labels };
  }, [data]);

  if (z.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-xs" style={{ color: "rgba(240,237,232,0.5)" }}>
        No weekly distribution records available for current selection.
      </div>
    );
  }

  const trace: Plotly.Data = {
    z,
    x: DAYS,
    y: yLabels,
    type: "heatmap",
    colorscale: "YlOrRd",
    hovertemplate: "Week of %{y}<br>%{x}: %{z} events<extra></extra>",
    colorbar: {
      title: { text: "Events" } as Plotly.ColorBarTitle,
      tickfont: { color: "rgba(240,237,232,0.7)", size: 11 },
    },
  };

  return (
    <PlotlyChart
      data={[trace]}
      layout={{
        xaxis: { title: { text: "Day of Week (UTC)" } },
        yaxis: { title: { text: "Week Starting Date (UTC)" } },
      }}
      height={400}
    />
  );
}

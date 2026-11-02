"use client";
/* components/charts/TopRegionsBar.tsx */
import { useMemo } from "react";
import PlotlyChart from "./PlotlyChart";
import type { Earthquake } from "@/lib/types";

export default function TopRegionsBar({ data }: { data: Earthquake[] }) {
  const sorted = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const eq of data) {
      // Extract geographical place label suffix (e.g. "Alaska", "Japan", "California")
      const parts = eq.place ? eq.place.split(", ") : [];
      const key = parts.length > 1 ? parts[parts.length - 1].trim() : (eq.place || "Unknown");
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [data]);

  if (sorted.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-xs" style={{ color: "rgba(240,237,232,0.5)" }}>
        No geographic location records available.
      </div>
    );
  }

  // Reverse so highest is at top in horizontal bar
  const displayRows = [...sorted].reverse();

  const trace: Plotly.Data = {
    x: displayRows.map((s) => s[1]),
    y: displayRows.map((s) => s[0]),
    type: "bar",
    orientation: "h",
    marker: {
      color: displayRows.map((_, i) => `rgba(232, 87, 42, ${0.4 + (i / displayRows.length) * 0.6})`),
    },
    hovertemplate: "<b>%{y}</b><br>%{x} events<extra></extra>",
  };

  return (
    <PlotlyChart
      data={[trace]}
      layout={{
        xaxis: { title: { text: "Recorded Events" } },
        yaxis: { automargin: true, tickfont: { size: 11 } },
        margin: { l: 140, r: 20, t: 30, b: 50 },
      }}
      height={360}
    />
  );
}

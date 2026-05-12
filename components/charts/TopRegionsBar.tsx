"use client";
/* components/charts/TopRegionsBar.tsx */
import PlotlyChart from "./PlotlyChart";
import type { Earthquake } from "@/lib/types";

export default function TopRegionsBar({ data }: { data: Earthquake[] }) {
  const counts: Record<string, number> = {};
  for (const eq of data) {
    const key = eq.place?.split(", ").pop() ?? eq.place ?? "Unknown";
    counts[key] = (counts[key] ?? 0) + 1;
  }
  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const trace: Plotly.Data = {
    x: sorted.map((s) => s[1]),
    y: sorted.map((s) => s[0]),
    type: "bar",
    orientation: "h",
    marker: {
      color: sorted.map((_, i) => `rgba(232,87,42,${1 - i * 0.07})`),
    },
    hovertemplate: "<b>%{y}</b><br>%{x} events<extra></extra>",
  };

  return (
    <PlotlyChart
      data={[trace]}
      layout={{
        xaxis: { title: { text: "Events" } },
        yaxis: { automargin: true, tickfont: { size: 10 } },
        margin: { l: 140, r: 20, t: 30, b: 50 },
      }}
      height={360}
    />
  );
}

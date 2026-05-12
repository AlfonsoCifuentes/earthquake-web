"use client";
/* components/charts/DepthDistribution.tsx */
import PlotlyChart from "./PlotlyChart";
import type { Earthquake } from "@/lib/types";

function catLabel(mag: number) {
  if (mag < 2) return "Minor (<2)";
  if (mag < 4) return "Light (2-4)";
  if (mag < 6) return "Moderate (4-6)";
  return "Strong (6+)";
}

const COLORS: Record<string, string> = {
  "Minor (<2)":    "#0a84ff",
  "Light (2-4)":   "#30d158",
  "Moderate (4-6)":"#ff9500",
  "Strong (6+)":   "#ff3b30",
};

export default function DepthDistribution({ data }: { data: Earthquake[] }) {
  const byCategory: Record<string, number[]> = {};
  for (const eq of data) {
    const cat = catLabel(eq.mag);
    (byCategory[cat] ??= []).push(eq.depth);
  }

  const traces = Object.entries(byCategory).map(
    ([cat, depths]) => ({
      x: depths,
      name: cat,
      type: "histogram" as const,
      opacity: 0.78,
      xbins: { start: 0, end: 800, size: 10 },
      marker: { color: COLORS[cat] ?? "#e8572a" },
    } as Plotly.Data)
  );

  return (
    <PlotlyChart
      data={traces}
      layout={{
        barmode: "overlay",
        xaxis: { title: { text: "Depth (km)" } },
        yaxis: { title: { text: "Events" } },
        bargap: 0.05,
      }}
      height={320}
    />
  );
}

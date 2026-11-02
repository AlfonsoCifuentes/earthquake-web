"use client";
/* components/charts/MagnitudePie.tsx */
import { useMemo } from "react";
import PlotlyChart from "./PlotlyChart";
import type { Earthquake } from "@/lib/types";

const CATEGORY_COLORS: Record<string, string> = {
  "Minor (<2)": "#0a84ff",
  "Light (2–4)": "#30d158",
  "Moderate (4–6)": "#ff9500",
  "Strong (6–7)": "#ff3b30",
  "Major (7+)": "#bf5af2",
};

export default function MagnitudePie({ data }: { data: Earthquake[] }) {
  const { labels, values, colors } = useMemo(() => {
    const cats: Record<string, number> = {
      "Minor (<2)": 0,
      "Light (2–4)": 0,
      "Moderate (4–6)": 0,
      "Strong (6–7)": 0,
      "Major (7+)": 0,
    };

    for (const eq of data) {
      const m = eq.mag;
      if (!Number.isFinite(m)) continue;
      if (m < 2) cats["Minor (<2)"]++;
      else if (m < 4) cats["Light (2–4)"]++;
      else if (m < 6) cats["Moderate (4–6)"]++;
      else if (m < 7) cats["Strong (6–7)"]++;
      else cats["Major (7+)"]++;
    }

    // Filter out 0% categories so empty wedges don't clutter the chart
    const activeEntries = Object.entries(cats).filter(([, count]) => count > 0);
    const activeLabels = activeEntries.map(([label]) => label);
    const activeValues = activeEntries.map(([, count]) => count);
    const activeColors = activeLabels.map((label) => CATEGORY_COLORS[label]);

    return { labels: activeLabels, values: activeValues, colors: activeColors };
  }, [data]);

  if (values.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-xs" style={{ color: "rgba(240,237,232,0.5)" }}>
        No magnitude distribution data available for current selection.
      </div>
    );
  }

  const trace: Plotly.Data = {
    labels,
    values,
    type: "pie",
    hole: 0.55,
    marker: {
      colors,
      line: { color: "rgba(0,0,0,0.5)", width: 1.5 },
    },
    textinfo: "label+percent",
    textposition: "outside",
    automargin: true,
    textfont: { color: "#f0ede8", size: 11 },
    hovertemplate: "<b>%{label}</b><br>%{value} events (%{percent})<extra></extra>",
  };

  return (
    <PlotlyChart
      data={[trace]}
      layout={{
        showlegend: true,
        legend: {
          orientation: "h",
          y: -0.15,
          font: { color: "rgba(240,237,232,0.7)", size: 11 },
        },
        margin: { l: 20, r: 20, t: 30, b: 40 },
      }}
      height={320}
    />
  );
}

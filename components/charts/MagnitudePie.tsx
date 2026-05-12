"use client";
/* components/charts/MagnitudePie.tsx */
import PlotlyChart from "./PlotlyChart";
import type { Earthquake } from "@/lib/types";

export default function MagnitudePie({ data }: { data: Earthquake[] }) {
  const cats: Record<string, number> = {
    "Minor (<2)": 0,
    "Light (2-4)": 0,
    "Moderate (4-6)": 0,
    "Strong (6-7)": 0,
    "Major (7+)": 0,
  };
  for (const eq of data) {
    if (eq.mag < 2) cats["Minor (<2)"]++;
    else if (eq.mag < 4) cats["Light (2-4)"]++;
    else if (eq.mag < 6) cats["Moderate (4-6)"]++;
    else if (eq.mag < 7) cats["Strong (6-7)"]++;
    else cats["Major (7+)"]++;
  }

  const trace: Plotly.Data = {
    labels: Object.keys(cats),
    values: Object.values(cats),
    type: "pie",
    hole: 0.55,
    marker: {
      colors: ["#0a84ff", "#30d158", "#ff9500", "#ff3b30", "#bf5af2"],
      line: { color: "rgba(0,0,0,0.4)", width: 1.5 },
    },
    textfont: { color: "#f0ede8" },
    hovertemplate: "<b>%{label}</b><br>%{value} events (%{percent})<extra></extra>",
  };

  return (
    <PlotlyChart
      data={[trace]}
      layout={{
        showlegend: true,
        margin: { l: 10, r: 10, t: 30, b: 10 },
      }}
      height={320}
    />
  );
}

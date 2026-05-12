"use client";
/* components/charts/WeeklyHeatmap.tsx */
import PlotlyChart from "./PlotlyChart";
import type { Earthquake } from "@/lib/types";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function WeeklyHeatmap({ data }: { data: Earthquake[] }) {
  // Build week × day matrix
  const weekDayMap: Record<string, number[]> = {};
  for (const eq of data) {
    const d = new Date(eq.time);
    const week = Math.floor(
      (d.getTime() - new Date("2005-01-03").getTime()) / (7 * 86400000)
    );
    const dow = (d.getDay() + 6) % 7; // Mon=0
    const key = String(week);
    (weekDayMap[key] ??= Array(7).fill(0))[dow]++;
  }

  const weeks = Object.keys(weekDayMap).sort();
  const z = weeks.map((w) => weekDayMap[w]);

  const trace: Plotly.Data = {
    z,
    x: DAYS,
    y: weeks.map((w) => {
      const startMs = new Date("2005-01-03").getTime() + parseInt(w) * 7 * 86400000;
      return new Date(startMs).toISOString().slice(0, 10);
    }),
    type: "heatmap",
    colorscale: "YlOrRd",
    hovertemplate: "Week: %{y}<br>%{x}: %{z} events<extra></extra>",
    colorbar: { tickfont: { color: "rgba(240,237,232,0.5)", size: 10 } },
  };

  return (
    <PlotlyChart
      data={[trace]}
      layout={{
        xaxis: { title: { text: "Day of Week" } },
        yaxis: { title: { text: "Week" } },
      }}
      height={400}
    />
  );
}

"use client";
/* components/charts/TimeSeriesBar.tsx — Daily event count with trend */
import PlotlyChart from "./PlotlyChart";
import type { Earthquake } from "@/lib/types";

export default function TimeSeriesBar({ data }: { data: Earthquake[] }) {
  const daily: Record<string, number> = {};
  for (const eq of data) {
    const day = eq.time?.slice(0, 10);
    if (day) daily[day] = (daily[day] ?? 0) + 1;
  }
  const sorted = Object.entries(daily).sort((a, b) => a[0].localeCompare(b[0]));
  const dates = sorted.map((s) => s[0]);
  const counts = sorted.map((s) => s[1]);

  // Simple 7-day rolling avg for trend line
  const rolling: (number | null)[] = counts.map((_, i) => {
    if (i < 3) return null;
    const slice = counts.slice(Math.max(0, i - 3), i + 4);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });

  const bar: Plotly.Data = {
    x: dates,
    y: counts,
    type: "bar",
    name: "Events/day",
    marker: { color: "rgba(232,87,42,0.55)" },
    hovertemplate: "%{x}<br>%{y} events<extra></extra>",
  };

  const line: Plotly.Data = {
    x: dates,
    y: rolling,
    type: "scatter",
    mode: "lines",
    name: "7-day avg",
    line: { color: "#00d4ff", width: 2, dash: "dot" },
    hovertemplate: "%{x}<br>Avg: %{y:.1f}<extra></extra>",
  };

  return (
    <PlotlyChart
      data={[bar, line]}
      layout={{
        xaxis: { title: { text: "Date" } },
        yaxis: { title: { text: "Events" } },
        barmode: "overlay",
        bargap: 0.1,
      }}
      height={340}
    />
  );
}

"use client";
/* components/charts/HourlyHeatmap.tsx */
import { useMemo } from "react";
import PlotlyChart from "./PlotlyChart";
import type { Earthquake } from "@/lib/types";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 24 }, (_, i) =>
  `${String(i).padStart(2, "0")}:00`
);

export default function HourlyHeatmap({ data }: { data: Earthquake[] }) {
  const matrix: number[][] = useMemo(() => {
    // 24×7 matrix: [hour][day]
    const m = Array.from({ length: 24 }, () => Array(7).fill(0));
    for (const eq of data) {
      if (!eq.time) continue;
      const d = new Date(eq.time);
      if (isNaN(d.getTime())) continue;
      const hour = d.getUTCHours();
      const dow = (d.getUTCDay() + 6) % 7;
      m[hour][dow]++;
    }
    return m;
  }, [data]);

  const trace: Plotly.Data = {
    z: matrix,
    x: DAYS,
    y: HOURS,
    type: "heatmap",
    colorscale: [
      [0, "#0d0d12"],
      [0.3, "#4a1000"],
      [0.6, "#e8572a"],
      [1, "#ffdb6e"],
    ],
    hovertemplate: "%{y} %{x}: %{z} events (UTC)<extra></extra>",
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
        yaxis: { title: { text: "Hour (UTC)" }, autorange: "reversed" },
      }}
      height={480}
    />
  );
}

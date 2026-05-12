"use client";
/* components/charts/MagnitudeHistogram.tsx */
import PlotlyChart from "./PlotlyChart";
import type { Earthquake } from "@/lib/types";

export default function MagnitudeHistogram({ data }: { data: Earthquake[] }) {
  const mags = data.map((d) => d.mag);

  const trace = {
    x: mags,
    type: "histogram",
    xbins: { start: 0, end: 11, size: 0.2 },
    marker: {
      color: mags,
      colorscale: [
        [0, "#0a84ff"],
        [0.25, "#30d158"],
        [0.55, "#ff9500"],
        [1, "#ff3b30"],
      ],
      line: { color: "rgba(0,0,0,0.3)", width: 0.5 },
    },
    hovertemplate: "Mag %{x:.1f}–%{x:.1f}: %{y} events<extra></extra>",
  };

  return (
    <PlotlyChart
      data={[trace as Plotly.Data]}
      layout={{
        xaxis: { title: { text: "Magnitude" } },
        yaxis: { title: { text: "Number of Events" } },
        bargap: 0.05,
      }}
      height={320}
    />
  );
}

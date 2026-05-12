"use client";
/* components/charts/MagDepthScatter.tsx */
import PlotlyChart from "./PlotlyChart";
import type { Earthquake } from "@/lib/types";

export default function MagDepthScatter({ data }: { data: Earthquake[] }) {
  const sample = data.slice(0, 2000);

  const trace: Plotly.Data = {
    x: sample.map((d) => d.mag),
    y: sample.map((d) => d.depth),
    mode: "markers",
    type: "scatter",
    text: sample.map((d) => d.place),
    marker: {
      color: sample.map((d) => d.depth),
      colorscale: "Plasma",
      reversescale: true,
      size: sample.map((d) => Math.max(4, d.mag * 2.5)),
      opacity: 0.7,
      colorbar: {
        title: { text: "Depth (km)" } as Plotly.ColorBarTitle,
        tickfont: { color: "rgba(240,237,232,0.5)", size: 10 },
      },
    },
    hovertemplate:
      "<b>%{text}</b><br>Mag: %{x:.1f}<br>Depth: %{y:.0f} km<extra></extra>",
  };

  return (
    <PlotlyChart
      data={[trace]}
      layout={{
        xaxis: { title: { text: "Magnitude" } },
        yaxis: { title: { text: "Depth (km)" }, autorange: "reversed" },
      }}
      height={340}
    />
  );
}

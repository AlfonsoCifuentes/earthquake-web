"use client";
/* components/charts/Scatter3D.tsx — 3D scatter: time × depth × magnitude */
import PlotlyChart from "./PlotlyChart";
import type { Earthquake } from "@/lib/types";

export default function Scatter3D({ data }: { data: Earthquake[] }) {
  const sample = data.slice(0, 1000);
  const years = sample.map((d) =>
    parseFloat(new Date(d.time).getFullYear().toString())
  );

  const trace: Plotly.Data = {
    x: years,
    y: sample.map((d) => d.mag),
    z: sample.map((d) => d.depth),
    mode: "markers",
    type: "scatter3d",
    marker: {
      color: sample.map((d) => d.mag),
      colorscale: "Plasma",
      size: 3,
      opacity: 0.75,
      colorbar: { title: { text: "Mag" } as Plotly.ColorBarTitle, tickfont: { color: "rgba(240,237,232,0.5)", size: 10 } },
    },
    text: sample.map((d) => d.place),
    hovertemplate:
      "<b>%{text}</b><br>Year: %{x}<br>Mag: %{y:.1f}<br>Depth: %{z:.0f}km<extra></extra>",
  };

  return (
    <PlotlyChart
      data={[trace]}
      layout={{
        scene: {
          xaxis: { title: { text: "Year" }, tickfont: { color: "rgba(240,237,232,0.5)" } },
          yaxis: { title: { text: "Magnitude" }, tickfont: { color: "rgba(240,237,232,0.5)" } },
          zaxis: { title: { text: "Depth (km)" }, tickfont: { color: "rgba(240,237,232,0.5)" } },
          bgcolor: "rgba(0,0,0,0)",
        },
        margin: { l: 0, r: 0, t: 20, b: 0 },
      }}
      height={440}
    />
  );
}

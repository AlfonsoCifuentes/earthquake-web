"use client";
/* components/charts/RegressionScatter.tsx — Magnitude vs Depth with linear regression */
import PlotlyChart from "./PlotlyChart";
import type { Earthquake } from "@/lib/types";

function linearRegression(x: number[], y: number[]) {
  const n = x.length;
  const mx = x.reduce((a, b) => a + b, 0) / n;
  const my = y.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (x[i] - mx) * (y[i] - my);
    den += (x[i] - mx) ** 2;
  }
  const slope = den ? num / den : 0;
  const intercept = my - slope * mx;
  return { slope, intercept };
}

export default function RegressionScatter({ data }: { data: Earthquake[] }) {
  const sample = data.slice(0, 2000);
  const x = sample.map((d) => d.mag);
  const y = sample.map((d) => d.depth);

  const { slope, intercept } = linearRegression(x, y);
  const xMin = Math.min(...x), xMax = Math.max(...x);
  const regX = [xMin, xMax];
  const regY = regX.map((v) => slope * v + intercept);

  const scatter: Plotly.Data = {
    x, y,
    mode: "markers",
    type: "scatter",
    name: "Earthquakes",
    text: sample.map((d) => d.place),
    marker: { color: "rgba(232,87,42,0.45)", size: 5 },
    hovertemplate: "<b>%{text}</b><br>Mag: %{x:.1f} · Depth: %{y:.0f}km<extra></extra>",
  };

  const regLine: Plotly.Data = {
    x: regX, y: regY,
    mode: "lines",
    type: "scatter",
    name: `Trend (slope=${slope.toFixed(2)})`,
    line: { color: "#00d4ff", width: 2 },
    hoverinfo: "skip",
  };

  return (
    <PlotlyChart
      data={[scatter, regLine]}
      layout={{
        xaxis: { title: { text: "Magnitude" } },
        yaxis: { title: { text: "Depth (km)" }, autorange: "reversed" },
      }}
      height={360}
    />
  );
}

"use client";
/* components/charts/RegressionScatter.tsx — Magnitude vs Depth with linear regression */
import { useMemo } from "react";
import PlotlyChart from "./PlotlyChart";
import type { Earthquake } from "@/lib/types";
import { calculateLinearRegression } from "@/lib/stats";

export default function RegressionScatter({ data }: { data: Earthquake[] }) {
  const { sample, scatter, regLine, hasValidRegression } = useMemo(() => {
    const valid = data.filter(
      (d) =>
        d &&
        Number.isFinite(d.mag) &&
        Number.isFinite(d.depth)
    );

    const s = valid.slice(0, 2000);
    const x = s.map((d) => d.mag);
    const y = s.map((d) => d.depth);

    const regression = calculateLinearRegression(x, y);

    const sc: Plotly.Data = {
      x,
      y,
      mode: "markers",
      type: "scatter",
      name: "Events",
      text: s.map((d) => d.place),
      marker: { color: "rgba(232,87,42,0.45)", size: 5 },
      hovertemplate: "<b>%{text}</b><br>Mag: %{x:.1f} · Depth: %{y:.0f}km<extra></extra>",
    };

    let rl: Plotly.Data | null = null;
    if (regression && x.length >= 2) {
      const xMin = Math.min(...x);
      const xMax = Math.max(...x);
      const regX = [xMin, xMax];
      const regY = regX.map((v) => regression.slope * v + regression.intercept);

      rl = {
        x: regX,
        y: regY,
        mode: "lines",
        type: "scatter",
        name: `OLS Trend (slope=${regression.slope.toFixed(2)})`,
        line: { color: "#00d4ff", width: 2 },
        hoverinfo: "skip",
      };
    }

    return {
      sample: s,
      scatter: sc,
      regLine: rl,
      hasValidRegression: !!regression,
    };
  }, [data]);

  if (sample.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-xs" style={{ color: "rgba(240,237,232,0.5)" }}>
        Insufficient data for regression analysis.
      </div>
    );
  }

  const traces: Plotly.Data[] = [scatter];
  if (regLine) traces.push(regLine);

  return (
    <PlotlyChart
      data={traces}
      layout={{
        xaxis: { title: { text: "Magnitude" } },
        yaxis: { title: { text: "Depth (km)" }, autorange: "reversed" },
      }}
      height={360}
    />
  );
}

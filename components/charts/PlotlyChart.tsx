"use client";
/* components/charts/PlotlyChart.tsx
   Lazy-loaded wrapper so plotly.js doesn't break SSR */
import dynamic from "next/dynamic";
import type { PlotParams } from "react-plotly.js";
import { ChartSkeleton } from "@/components/ui/Skeleton";

const Plot = dynamic(() => import("react-plotly.js"), {
  ssr: false,
  loading: ({ isLoading }) =>
    isLoading ? <ChartSkeleton /> : null,
}) as React.ComponentType<PlotParams>;

interface Props extends Omit<PlotParams, "layout"> {
  layout?: Partial<Plotly.Layout>;
  height?: number;
  className?: string;
}

export default function PlotlyChart({
  data,
  layout = {},
  height = 360,
  className = "",
  ...rest
}: Props) {
  const merged: Partial<Plotly.Layout> = {
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    font: {
      family: "Inter, 'Helvetica Neue', sans-serif",
      color: "rgba(240,237,232,0.75)",
      size: 12,
    },
    colorway: [
      "#e8572a", "#00d4ff", "#ff9500", "#30d158",
      "#bf5af2", "#ffd60a", "#ff375f", "#63e6be",
    ],
    xaxis: {
      gridcolor: "rgba(255,255,255,0.06)",
      zerolinecolor: "rgba(255,255,255,0.12)",
      tickfont: { color: "rgba(240,237,232,0.45)", size: 11 },
    },
    yaxis: {
      gridcolor: "rgba(255,255,255,0.06)",
      zerolinecolor: "rgba(255,255,255,0.12)",
      tickfont: { color: "rgba(240,237,232,0.45)", size: 11 },
    },
    margin: { l: 52, r: 18, t: 36, b: 52 },
    legend: {
      bgcolor: "rgba(0,0,0,0)",
      font: { color: "rgba(240,237,232,0.55)", size: 11 },
    },
    hoverlabel: {
      bgcolor: "rgba(10,10,14,0.96)",
      bordercolor: "rgba(232,87,42,0.5)",
      font: { color: "#f0ede8", size: 12 },
    },
    height,
    autosize: true,
    ...layout,
  };

  return (
    <div className={`w-full overflow-hidden ${className}`}>
      <Plot
        data={data}
        layout={merged}
        config={{
          displayModeBar: true,
          displaylogo: false,
          responsive: true,
          modeBarButtonsToRemove: ["select2d", "lasso2d"],
        }}
        style={{ width: "100%", height }}
        useResizeHandler
        {...rest}
      />
    </div>
  );
}

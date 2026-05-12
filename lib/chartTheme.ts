/* lib/chartTheme.ts — Shared dark Plotly template matching Streamlit original */

export const PLOTLY_DARK: Partial<Plotly.Layout> = {
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
    gridcolor: "rgba(255,255,255,0.05)",
    zerolinecolor: "rgba(255,255,255,0.1)",
    tickfont: { color: "rgba(240,237,232,0.5)", size: 11 },
    title: { font: { color: "rgba(240,237,232,0.6)" } },
  },
  yaxis: {
    gridcolor: "rgba(255,255,255,0.05)",
    zerolinecolor: "rgba(255,255,255,0.1)",
    tickfont: { color: "rgba(240,237,232,0.5)", size: 11 },
    title: { font: { color: "rgba(240,237,232,0.6)" } },
  },
  margin: { l: 50, r: 20, t: 40, b: 50 },
  legend: {
    bgcolor: "rgba(0,0,0,0)",
    font: { color: "rgba(240,237,232,0.6)", size: 11 },
  },
  hoverlabel: {
    bgcolor: "rgba(13,13,18,0.95)",
    bordercolor: "rgba(232,87,42,0.5)",
    font: { color: "#f0ede8", size: 12 },
  },
};

/* Magnitude → color */
export function magColor(mag: number): string {
  if (mag < 2) return "#0a84ff";
  if (mag < 4) return "#30d158";
  if (mag < 6) return "#ff9500";
  return "#ff3b30";
}

/* Magnitude → marker size */
export function magSize(mag: number): number {
  return Math.max(4, mag * 3.5);
}

/* Depth → color */
export function depthColor(depth: number): string {
  if (depth < 10) return "#ff3b30";
  if (depth < 50) return "#ff9500";
  if (depth < 100) return "#ffd60a";
  return "#30d158";
}

"use client";
/* components/charts/CorrelationMatrix.tsx */
import PlotlyChart from "./PlotlyChart";
import type { Earthquake } from "@/lib/types";

function pearson(a: number[], b: number[]): number {
  const n = a.length;
  const ma = a.reduce((s, x) => s + x, 0) / n;
  const mb = b.reduce((s, x) => s + x, 0) / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    const A = a[i] - ma, B = b[i] - mb;
    num += A * B;
    da += A * A;
    db += B * B;
  }
  return da && db ? num / Math.sqrt(da * db) : 0;
}

const FIELDS: (keyof Earthquake)[] = ["mag", "depth", "latitude", "longitude"];
const LABELS = ["Magnitude", "Depth (km)", "Latitude", "Longitude"];

export default function CorrelationMatrix({ data }: { data: Earthquake[] }) {
  const arrays = FIELDS.map((f) => data.map((d) => (d[f] as number) ?? 0));
  const n = FIELDS.length;
  const z: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (__, j) => parseFloat(pearson(arrays[i], arrays[j]).toFixed(3)))
  );

  const trace = {
    z,
    x: LABELS,
    y: LABELS,
    type: "heatmap",
    colorscale: "RdBu",
    zmin: -1,
    zmax: 1,
    text: z.map((row) => row.map((v) => v.toFixed(2))),
    texttemplate: "%{text}",
    textfont: { size: 12 },
    hovertemplate: "%{y} × %{x}<br>r = %{z:.3f}<extra></extra>",
    colorbar: { tickfont: { color: "rgba(240,237,232,0.5)", size: 10 } },
  };

  return (
    <PlotlyChart
      data={[trace as unknown as Plotly.Data]}
      layout={{ margin: { l: 110, r: 20, t: 30, b: 110 } }}
      height={380}
    />
  );
}

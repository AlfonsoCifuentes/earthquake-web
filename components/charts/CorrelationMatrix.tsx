"use client";
/* components/charts/CorrelationMatrix.tsx */
import { useMemo } from "react";
import PlotlyChart from "./PlotlyChart";
import type { Earthquake } from "@/lib/types";
import { calculatePearson } from "@/lib/stats";

const FIELDS: (keyof Earthquake)[] = ["mag", "depth", "latitude", "longitude"];
const LABELS = ["Magnitude", "Depth (km)", "Latitude", "Longitude"];

export default function CorrelationMatrix({ data }: { data: Earthquake[] }) {
  const { z, textMatrix, hasData } = useMemo(() => {
    if (!data.length || data.length < 2) {
      return { z: [], textMatrix: [], hasData: false };
    }

    const arrays = FIELDS.map((f) =>
      data.map((d) => (typeof d[f] === "number" && Number.isFinite(d[f] as number) ? (d[f] as number) : NaN))
    );

    const n = FIELDS.length;
    const zMatrix: (number | null)[][] = [];
    const tMatrix: string[][] = [];

    for (let i = 0; i < n; i++) {
      const zRow: (number | null)[] = [];
      const tRow: string[] = [];
      for (let j = 0; j < n; j++) {
        if (i === j) {
          zRow.push(1.0);
          tRow.push("1.00");
        } else {
          const r = calculatePearson(arrays[i], arrays[j]);
          if (r !== null) {
            zRow.push(parseFloat(r.toFixed(3)));
            tRow.push(r.toFixed(2));
          } else {
            zRow.push(null);
            tRow.push("N/A");
          }
        }
      }
      zMatrix.push(zRow);
      tMatrix.push(tRow);
    }

    return { z: zMatrix, textMatrix: tMatrix, hasData: true };
  }, [data]);

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-64 text-xs" style={{ color: "rgba(240,237,232,0.5)" }}>
        Insufficient observations to compute correlation matrix (minimum 2 events with non-zero variance required).
      </div>
    );
  }

  const trace = {
    z,
    x: LABELS,
    y: LABELS,
    type: "heatmap",
    colorscale: "RdBu",
    zmin: -1,
    zmax: 1,
    text: textMatrix,
    texttemplate: "%{text}",
    textfont: { size: 12, color: "#f0ede8" },
    hovertemplate: "%{y} × %{x}<br>Pearson r = %{text}<extra></extra>",
    colorbar: {
      title: { text: "r" } as Plotly.ColorBarTitle,
      tickfont: { color: "rgba(240,237,232,0.7)", size: 11 },
    },
  };

  return (
    <PlotlyChart
      data={[trace as unknown as Plotly.Data]}
      layout={{ margin: { l: 110, r: 20, t: 30, b: 110 } }}
      height={380}
    />
  );
}

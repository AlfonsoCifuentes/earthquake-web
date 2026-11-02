"use client";
/* components/charts/TimeSeriesBar.tsx — Daily event count with retrospective trend */
import { useMemo } from "react";
import PlotlyChart from "./PlotlyChart";
import type { Earthquake } from "@/lib/types";
import { fillDailyContinuousSeries, computeRetrospective7DayAverage } from "@/lib/temporal";

export default function TimeSeriesBar({ data }: { data: Earthquake[] }) {
  const { dates, counts, rolling } = useMemo(() => {
    if (!data.length) {
      return { dates: [], counts: [], rolling: [] };
    }
    const dailyMap = new Map<string, number>();
    for (const eq of data) {
      const day = eq.time?.slice(0, 10);
      if (day) {
        dailyMap.set(day, (dailyMap.get(day) ?? 0) + 1);
      }
    }
    const entries = Array.from(dailyMap.entries()).map(([date, count]) => ({ date, count }));
    const continuous = fillDailyContinuousSeries(entries);
    const dList = continuous.map((c) => c.date);
    const cList = continuous.map((c) => c.count);
    const rList = computeRetrospective7DayAverage(cList);

    return { dates: dList, counts: cList, rolling: rList };
  }, [data]);

  if (dates.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-xs" style={{ color: "rgba(240,237,232,0.5)" }}>
        No temporal event records available for current selection.
      </div>
    );
  }

  const bar: Plotly.Data = {
    x: dates,
    y: counts,
    type: "bar",
    name: "Events/day",
    marker: { color: "rgba(232,87,42,0.55)" },
    hovertemplate: "%{x}<br>%{y} events<extra></extra>",
  };

  const line: Plotly.Data = {
    x: dates,
    y: rolling,
    type: "scatter",
    mode: "lines",
    name: "7-day retrospective avg",
    line: { color: "#00d4ff", width: 2, dash: "dot" },
    hovertemplate: "%{x}<br>7d Avg: %{y:.1f}<extra></extra>",
  };

  return (
    <PlotlyChart
      data={[bar, line]}
      layout={{
        xaxis: { title: { text: "Date (UTC)" } },
        yaxis: { title: { text: "Event Count" } },
        barmode: "overlay",
        bargap: 0.1,
      }}
      height={340}
    />
  );
}

"use client";
/* components/maps/RiskForecastMap.tsx */
import dynamic from "next/dynamic";
import { MapSkeleton } from "@/components/ui/Skeleton";
import type { Prediction } from "@/lib/types";

const Inner = dynamic(() => import("./RiskForecastMapInner"), {
  ssr: false,
  loading: () => <MapSkeleton height={440} />,
});

export default function RiskForecastMap({
  predictions,
  height = 440,
}: {
  predictions: Prediction[];
  height?: number;
}) {
  return <Inner predictions={predictions} height={height} />;
}

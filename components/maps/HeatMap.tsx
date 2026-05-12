"use client";
/* components/maps/HeatMap.tsx — Leaflet density heatmap using leaflet.heat */
import dynamic from "next/dynamic";
import { MapSkeleton } from "@/components/ui/Skeleton";

const HeatMapInner = dynamic(() => import("./HeatMapInner"), {
  ssr: false,
  loading: () => <MapSkeleton height={480} />,
});

import type { Earthquake } from "@/lib/types";

export default function HeatMap({
  data,
  height = 480,
}: {
  data: Earthquake[];
  height?: number;
}) {
  return <HeatMapInner data={data} height={height} />;
}

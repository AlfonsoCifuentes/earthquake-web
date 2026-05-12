"use client";
/* components/maps/ClusterMap.tsx — DBSCAN cluster visualization */
import dynamic from "next/dynamic";
import { MapSkeleton } from "@/components/ui/Skeleton";

const ClusterMapInner = dynamic(() => import("./ClusterMapInner"), {
  ssr: false,
  loading: () => <MapSkeleton height={480} />,
});

import type { ClusterPoint, ClusterCentroid } from "@/lib/types";

export default function ClusterMap({
  points,
  centroids,
  height = 480,
}: {
  points: ClusterPoint[];
  centroids: ClusterCentroid[];
  height?: number;
}) {
  return <ClusterMapInner points={points} centroids={centroids} height={height} />;
}

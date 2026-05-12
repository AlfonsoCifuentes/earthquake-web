"use client";
/* components/maps/EventsMap.tsx
   Interactive Leaflet map with magnitude-sized/colored CircleMarkers.
   Lazy-loaded to avoid SSR issues. */
import dynamic from "next/dynamic";
import { MapSkeleton } from "@/components/ui/Skeleton";

const EventsMapInner = dynamic(() => import("./EventsMapInner"), {
  ssr: false,
  loading: () => <MapSkeleton height={480} />,
});

import type { Earthquake } from "@/lib/types";

interface Props {
  data: Earthquake[];
  height?: number;
  showHeat?: boolean;
}

export default function EventsMap({ data, height = 480, showHeat = false }: Props) {
  return <EventsMapInner data={data} height={height} showHeat={showHeat} />;
}

"use client";
/* components/maps/HeatMapInner.tsx */
import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Earthquake } from "@/lib/types";
import L from "leaflet";

/* leaflet.heat is not typed, load via script */
function HeatLayer({ points }: { points: [number, number, number][] }) {
  const map = useMap();
  useEffect(() => {
    // Dynamically import leaflet-heat
    import("leaflet.heat" as string).then(() => {
      // @ts-expect-error — leaflet.heat extends L
      const heat = L.heatLayer(points, {
        radius: 18,
        blur: 20,
        maxZoom: 6,
        gradient: {
          0.0: "#0a84ff",
          0.3: "#30d158",
          0.6: "#ff9500",
          0.85: "#ff3b30",
          1.0: "#bf5af2",
        },
      });
      heat.addTo(map);
      return () => { map.removeLayer(heat); };
    }).catch(() => {
      // Fallback: render nothing if leaflet.heat unavailable
    });
  }, [map, points]);
  return null;
}

export default function HeatMapInner({
  data,
  height,
}: {
  data: Earthquake[];
  height: number;
}) {
  const points: [number, number, number][] = data.slice(0, 5000).map((d) => [
    d.latitude,
    d.longitude,
    Math.min(d.mag / 10, 1),
  ]);

  return (
    <div style={{ height, borderRadius: 16, overflow: "hidden" }}>
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom
        minZoom={1}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OSM &copy; CARTO'
          subdomains="abcd"
          maxZoom={20}
        />
        <HeatLayer points={points} />
      </MapContainer>
    </div>
  );
}

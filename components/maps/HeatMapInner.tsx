"use client";
/* components/maps/HeatMapInner.tsx */
import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Earthquake } from "@/lib/types";
import { mapTiles } from "@/lib/mapConfig";
import L from "leaflet";

function HeatLayer({ points }: { points: [number, number, number][] }) {
  const map = useMap();

  useEffect(() => {
    let cancelled = false;
    let heatLayerInstance: L.Layer | null = null;

    void import("leaflet.heat" as string)
      .then(() => {
        if (cancelled) return;
        // @ts-expect-error — leaflet.heat extends L with heatLayer
        heatLayerInstance = L.heatLayer(points, {
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
        if (heatLayerInstance) {
          heatLayerInstance.addTo(map);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn("Could not load leaflet.heat layer", err);
        }
      });

    return () => {
      cancelled = true;
      if (heatLayerInstance) {
        try {
          map.removeLayer(heatLayerInstance);
        } catch {
          // ignore if already removed
        }
      }
    };
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
  const points: [number, number, number][] = useMemo(() => {
    const valid = data.filter(
      (d) =>
        d &&
        Number.isFinite(d.latitude) &&
        Number.isFinite(d.longitude) &&
        d.latitude >= -90 &&
        d.latitude <= 90 &&
        d.longitude >= -180 &&
        d.longitude <= 180
    );
    return valid.slice(0, 5000).map((d) => [
      d.latitude,
      d.longitude,
      Math.min(Math.max((d.mag || 0) / 10, 0.1), 1),
    ]);
  }, [data]);

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
          url={mapTiles.url}
          attribution={mapTiles.attribution}
          subdomains={mapTiles.subdomains}
          maxZoom={mapTiles.maxZoom}
        />
        <HeatLayer points={points} />
      </MapContainer>
    </div>
  );
}

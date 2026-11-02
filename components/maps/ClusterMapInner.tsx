"use client";
/* components/maps/ClusterMapInner.tsx */
import { useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { ClusterPoint, ClusterCentroid } from "@/lib/types";
import { mapTiles } from "@/lib/mapConfig";

const CLUSTER_PALETTE = [
  "#e8572a", "#00d4ff", "#30d158", "#ff9500",
  "#bf5af2", "#ffd60a", "#ff375f", "#63e6be",
  "#ff6b35", "#4ecdc4", "#45b7d1", "#96ceb4",
];

function clusterColor(id: number): string {
  if (id < 0) return "rgba(150,150,150,0.4)"; // noise
  return CLUSTER_PALETTE[id % CLUSTER_PALETTE.length];
}

export default function ClusterMapInner({
  points,
  centroids,
  height,
}: {
  points: ClusterPoint[];
  centroids: ClusterCentroid[];
  height: number;
}) {
  const validPoints = useMemo(() => {
    return (points || []).filter(
      (p) =>
        p &&
        Number.isFinite(p.latitude) &&
        Number.isFinite(p.longitude) &&
        p.latitude >= -90 &&
        p.latitude <= 90 &&
        p.longitude >= -180 &&
        p.longitude <= 180
    );
  }, [points]);

  const validCentroids = useMemo(() => {
    return (centroids || []).filter(
      (c) =>
        c &&
        Number.isFinite(c.lat) &&
        Number.isFinite(c.lon) &&
        c.lat >= -90 &&
        c.lat <= 90 &&
        c.lon >= -180 &&
        c.lon <= 180
    );
  }, [centroids]);

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
        {/* Cluster points */}
        {validPoints.slice(0, 3000).map((p, i) => (
          <CircleMarker
            key={p.id || `cp-${i}`}
            center={[p.latitude, p.longitude]}
            radius={Math.max(3, (p.mag || 5) * 1.8)}
            pathOptions={{
              color: clusterColor(p.cluster),
              fillColor: clusterColor(p.cluster),
              fillOpacity: 0.6,
              weight: 0.5,
            }}
          >
            <Popup>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12 }}>
                <b>{p.place || "Unknown"}</b><br />
                Cluster: {p.cluster < 0 ? "Noise / Outlier" : `Cluster ${p.cluster + 1}`}<br />
                M {(p.mag || 0).toFixed(1)} · {(p.depth ?? 0).toFixed(0)} km depth
              </div>
            </Popup>
          </CircleMarker>
        ))}
        {/* Centroids */}
        {validCentroids.map((c) => (
          <CircleMarker
            key={`centroid-${c.cluster}`}
            center={[c.lat, c.lon]}
            radius={18}
            pathOptions={{
              color: clusterColor(c.cluster),
              fillColor: clusterColor(c.cluster),
              fillOpacity: 0.25,
              weight: 2.5,
              dashArray: "6 4",
            }}
          >
            <Popup>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12 }}>
                <b>{c.name || `Cluster ${c.cluster + 1}`} centroid</b><br />
                {c.count} events · Avg M {c.avg_mag?.toFixed(1) ?? "—"}<br />
                Coords: {c.lat.toFixed(2)}°, {c.lon.toFixed(2)}°
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}

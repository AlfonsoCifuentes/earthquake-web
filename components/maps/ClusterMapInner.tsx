"use client";
/* components/maps/ClusterMapInner.tsx */
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { ClusterPoint, ClusterCentroid } from "@/lib/types";

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
        {/* Cluster points */}
        {points.slice(0, 3000).map((p, i) => (
          <CircleMarker
            key={i}
            center={[p.latitude, p.longitude]}
            radius={Math.max(3, p.mag * 1.8)}
            pathOptions={{
              color: clusterColor(p.cluster),
              fillColor: clusterColor(p.cluster),
              fillOpacity: 0.6,
              weight: 0.5,
            }}
          >
            <Popup>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12 }}>
                <b>{p.place}</b><br />
                Cluster {p.cluster < 0 ? "Noise" : p.cluster}<br />
                M {p.mag.toFixed(1)} · {p.depth?.toFixed(0)} km
              </div>
            </Popup>
          </CircleMarker>
        ))}
        {/* Centroids */}
        {centroids.map((c) => (
          <CircleMarker
            key={`centroid-${c.cluster}`}
            center={[c.lat, c.lon]}
            radius={16}
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
                <b>Cluster {c.cluster} centroid</b><br />
                {c.count} events · Avg M {c.avg_mag.toFixed(1)}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}

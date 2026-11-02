"use client";
/* components/maps/EventsMapInner.tsx — Client-only Leaflet implementation */
import { useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Earthquake } from "@/lib/types";
import { mapTiles } from "@/lib/mapConfig";

/* ── Color helpers ─────────────────────────────────────── */
function magColor(mag: number): string {
  if (mag < 2) return "#0a84ff";
  if (mag < 4) return "#30d158";
  if (mag < 6) return "#ff9500";
  if (mag < 7) return "#ff3b30";
  return "#bf5af2";
}

function magRadius(mag: number): number {
  return Math.max(4, mag * 3.2);
}

/* ── Auto-fit bounds ────────────────────────────────────── */
function FitBounds({ data }: { data: Earthquake[] }) {
  const map = useMap();
  useEffect(() => {
    if (!data.length) return;
    const lats = data.map((d) => d.latitude).filter((lat) => Number.isFinite(lat));
    if (!lats.length) return;
    const latRange = Math.max(...lats) - Math.min(...lats);
    if (latRange < 30) {
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const lons = data.map((d) => d.longitude).filter((lon) => Number.isFinite(lon));
      const minLon = Math.min(...lons);
      const maxLon = Math.max(...lons);
      map.fitBounds(
        [[minLat, minLon], [maxLat, maxLon]],
        { padding: [30, 30] }
      );
    }
  }, [data, map]);
  return null;
}

interface Props {
  data: Earthquake[];
  height: number;
  showHeat?: boolean;
}

export default function EventsMapInner({ data, height }: Props) {
  // Validate points have finite coordinates in legal range
  const validData = useMemo(() => {
    return data.filter(
      (eq) =>
        eq &&
        Number.isFinite(eq.latitude) &&
        Number.isFinite(eq.longitude) &&
        eq.latitude >= -90 &&
        eq.latitude <= 90 &&
        eq.longitude >= -180 &&
        eq.longitude <= 180
    );
  }, [data]);

  const maxPoints = 3000;
  const isTruncated = validData.length > maxPoints;
  const sample = useMemo(() => validData.slice(0, maxPoints), [validData]);

  return (
    <div className="relative" style={{ height, borderRadius: 16, overflow: "hidden" }}>
      {isTruncated && (
        <div
          className="absolute top-3 right-3 z-[1000] px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{
            background: "rgba(6,6,8,0.85)",
            backdropFilter: "blur(8px)",
            border: "1px solid var(--border)",
            color: "rgba(240,237,232,0.75)",
          }}
        >
          Showing 3,000 of {validData.length.toLocaleString()} events (performance sampling)
        </div>
      )}
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
        <FitBounds data={sample} />
        {sample.map((eq) => (
          <CircleMarker
            key={eq.id || `${eq.latitude}-${eq.longitude}-${eq.time}`}
            center={[eq.latitude, eq.longitude]}
            radius={magRadius(eq.mag)}
            pathOptions={{
              color: magColor(eq.mag),
              fillColor: magColor(eq.mag),
              fillOpacity: 0.6,
              weight: 0.8,
            }}
          >
            <Popup>
              <div style={{ fontFamily: "Inter, sans-serif", minWidth: 200 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
                  {eq.place}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px", fontSize: 12 }}>
                  <span style={{ color: "#aaa" }}>Magnitude</span>
                  <span style={{ color: magColor(eq.mag), fontWeight: 700 }}>
                    M {eq.mag.toFixed(1)}
                  </span>
                  <span style={{ color: "#aaa" }}>Depth</span>
                  <span>{eq.depth?.toFixed(1)} km</span>
                  <span style={{ color: "#aaa" }}>Time</span>
                  <span>{eq.time?.slice(0, 19).replace("T", " ")} UTC</span>
                  <span style={{ color: "#aaa" }}>Lat/Lon</span>
                  <span>
                    {eq.latitude.toFixed(2)}, {eq.longitude.toFixed(2)}
                  </span>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}

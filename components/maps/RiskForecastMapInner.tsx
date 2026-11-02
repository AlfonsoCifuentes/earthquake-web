"use client";
/* components/maps/RiskForecastMapInner.tsx */
import { useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Prediction } from "@/lib/types";
import { mapTiles } from "@/lib/mapConfig";
import { formatProbability } from "@/lib/format";

const RISK_COLOR_MAP: Record<string, string> = {
  critical: "#ff3b30",
  red: "#ff3b30",
  high: "#ff9500",
  orange: "#ff9500",
  moderate: "#ffd60a",
  yellow: "#ffd60a",
  low: "#30d158",
  green: "#30d158",
};

function getRiskColor(level: string | undefined): string {
  if (!level) return "#888";
  return RISK_COLOR_MAP[level.toLowerCase()] ?? "#888";
}

export default function RiskForecastMapInner({
  predictions,
  height,
}: {
  predictions: Prediction[];
  height: number;
}) {
  const validPredictions = useMemo(() => {
    return (predictions || []).filter(
      (p) =>
        p &&
        Number.isFinite(p.lat) &&
        Number.isFinite(p.lon) &&
        p.lat >= -90 &&
        p.lat <= 90 &&
        p.lon >= -180 &&
        p.lon <= 180
    );
  }, [predictions]);

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
        {validPredictions.map((p) => {
          const color = getRiskColor(p.risk_level || p.risk_color);
          return (
            <CircleMarker
              key={p.region}
              center={[p.lat, p.lon]}
              radius={24}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: 0.22,
                weight: 2,
              }}
            >
              <Popup>
                <div style={{ fontFamily: "Inter, sans-serif", minWidth: 240, fontSize: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
                    {p.region}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 12px" }}>
                    <span style={{ color: "#aaa" }}>1-Year Prob</span>
                    <span style={{ color, fontWeight: 700 }}>
                      {formatProbability(p.prob_1yr)}
                    </span>
                    <span style={{ color: "#aaa" }}>5-Year Prob</span>
                    <span>{formatProbability(p.prob_5yr)}</span>
                    <span style={{ color: "#aaa" }}>Events/yr</span>
                    <span>{p.events_per_year.toFixed(2)}</span>
                    <span style={{ color: "#aaa" }}>Mean interval</span>
                    <span>{p.recurrence_months != null ? `${p.recurrence_months.toFixed(1)} mo` : "—"}</span>
                    <span style={{ color: "#aaa" }}>Last event</span>
                    <span>{p.last_event_date || "—"}</span>
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 10,
                      color: "#888",
                      lineHeight: 1.3,
                      borderTop: "1px solid rgba(255,255,255,0.1)",
                      paddingTop: 6,
                    }}
                  >
                    Poisson model from 2005–2025 records. Not an earthquake prediction.
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}

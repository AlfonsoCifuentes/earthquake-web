"use client";
/* components/maps/RiskForecastMapInner.tsx */
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Prediction } from "@/lib/types";

const RISK_COLOR: Record<string, string> = {
  critical: "#ff3b30",
  red:      "#ff3b30",
  high:     "#ff9500",
  orange:   "#ff9500",
  moderate: "#ffd60a",
  yellow:   "#ffd60a",
  low:      "#30d158",
  green:    "#30d158",
};

function riskColor(color: string) {
  return RISK_COLOR[color?.toLowerCase()] ?? "#888";
}

export default function RiskForecastMapInner({
  predictions,
  height,
}: {
  predictions: Prediction[];
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
        {predictions.map((p) => {
          if (!p.lat || !p.lon) return null;
          const color = riskColor(p.risk_color);
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
                <div style={{ fontFamily: "Inter, sans-serif", minWidth: 220, fontSize: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
                    {p.region}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 12px" }}>
                    <span style={{ color: "#aaa" }}>Prob 1yr</span>
                    <span style={{ color, fontWeight: 700 }}>
                      {(p.prob_1yr * 100).toFixed(1)}%
                    </span>
                    <span style={{ color: "#aaa" }}>Prob 5yr</span>
                    <span>{(p.prob_5yr * 100).toFixed(1)}%</span>
                    <span style={{ color: "#aaa" }}>Events/yr</span>
                    <span>{p.events_per_year.toFixed(2)}</span>
                    <span style={{ color: "#aaa" }}>Recurrence</span>
                    <span>{p.recurrence_months != null ? p.recurrence_months.toFixed(1) : "—"} months</span>
                    <span style={{ color: "#aaa" }}>Next est.</span>
                    <span>{p.next_estimated}</span>
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

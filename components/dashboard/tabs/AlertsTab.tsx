"use client";
/* components/dashboard/tabs/AlertsTab.tsx */
import { useState } from "react";
import { useAlerts } from "@/lib/hooks/useEarthquakeData";
import { ChartSkeleton, MapSkeleton } from "@/components/ui/Skeleton";
import EventsMap from "@/components/maps/EventsMap";
import Badge from "@/components/ui/Badge";
import type { Alert } from "@/lib/types";

type FeedType = "significant_week" | "m4.5_day" | "m2.5_hour";

const FEED_OPTIONS: { id: FeedType; label: string; desc: string }[] = [
  { id: "significant_week", label: "Significant (week)",  desc: "Notable events past 7 days" },
  { id: "m4.5_day",         label: "M4.5+ (24h)",         desc: "M≥4.5 past 24 hours" },
  { id: "m2.5_hour",        label: "M2.5+ (1h)",          desc: "M≥2.5 past hour" },
];

function alertVariant(level: string): Parameters<typeof Badge>[0]["variant"] {
  switch (level) {
    case "critical": return "critical";
    case "high":     return "high";
    case "moderate": return "moderate";
    default:         return "low";
  }
}

function AlertRow({ alert }: { alert: Alert }) {
  return (
    <div
      className="flex items-start gap-4 rounded-xl px-4 py-3 transition-all"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid var(--border)",
        marginBottom: 8,
      }}
    >
      {/* Mag badge */}
      <div
        className="shrink-0 w-14 h-14 rounded-xl flex items-center justify-center font-bold text-lg"
        style={{
          background:
            alert.mag >= 7
              ? "rgba(191,90,242,0.15)"
              : alert.mag >= 6
              ? "rgba(255,59,48,0.15)"
              : alert.mag >= 5
              ? "rgba(255,149,0,0.15)"
              : "rgba(48,209,88,0.12)",
          color:
            alert.mag >= 7
              ? "#bf5af2"
              : alert.mag >= 6
              ? "#ff3b30"
              : alert.mag >= 5
              ? "#ff9500"
              : "#30d158",
        }}
      >
        M{alert.mag.toFixed(1)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="font-semibold text-sm truncate"
            style={{ color: "var(--text)" }}
          >
            {alert.place}
          </span>
          <Badge variant={alertVariant(alert.alert)}>
            {alert.alert}
          </Badge>
          {alert.tsunami === 1 && (
            <Badge variant="critical">TSUNAMI</Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-4 text-xs" style={{ color: "rgba(240,237,232,0.4)" }}>
          <span>{alert.time?.slice(0, 19).replace("T", " ")} UTC</span>
          <span>{alert.depth?.toFixed(1)} km depth</span>
          {alert.felt && <span>{alert.felt.toLocaleString()} felt reports</span>}
          {alert.cdi && <span>CDI {alert.cdi.toFixed(1)}</span>}
          <span>{alert.age_hours.toFixed(1)}h ago</span>
        </div>
      </div>
    </div>
  );
}

export default function AlertsTab() {
  const [feed, setFeed] = useState<FeedType>("significant_week");
  const { data, isLoading } = useAlerts(feed);

  const alerts: Alert[] = data?.data ?? [];
  const alertsAsEq = alerts.map((a) => ({
    id: a.id,
    time: a.time,
    mag: a.mag,
    depth: a.depth,
    latitude: a.latitude,
    longitude: a.longitude,
    place: a.place,
  }));

  return (
    <div className="flex flex-col gap-5">
      {/* Feed selector */}
      <div className="flex gap-3 flex-wrap">
        {FEED_OPTIONS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFeed(f.id)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              background: feed === f.id ? "rgba(232,87,42,0.2)" : "rgba(255,255,255,0.04)",
              color: feed === f.id ? "var(--primary)" : "rgba(240,237,232,0.45)",
              border: feed === f.id ? "1px solid rgba(232,87,42,0.35)" : "1px solid var(--border)",
              cursor: "pointer",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Summary stats */}
      {data?.summary && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Critical", count: data.summary.critical, color: "#ff3b30" },
            { label: "High",     count: data.summary.high,     color: "#ff9500" },
            { label: "Moderate", count: data.summary.moderate, color: "#ffd60a" },
            { label: "Low",      count: data.summary.low,      color: "#30d158" },
          ].map((s) => (
            <div
              key={s.label}
              className="glass rounded-xl p-4 text-center"
              style={{ border: "1px solid var(--border)" }}
            >
              <p className="text-xs mb-1" style={{ color: "rgba(240,237,232,0.35)" }}>
                {s.label}
              </p>
              <p className="text-2xl font-bold" style={{ color: s.color }}>
                {s.count}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Two-column layout: list + map */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Alert list */}
        <div className="glass rounded-2xl p-5" style={{ border: "1px solid var(--border)", maxHeight: 560, overflowY: "auto" }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: "rgba(240,237,232,0.5)" }}>
            {FEED_OPTIONS.find((f) => f.id === feed)?.desc} — {alerts.length} events
          </h3>
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <ChartSkeleton key={i} height={70} />
              ))}
            </div>
          ) : alerts.length === 0 ? (
            <p style={{ color: "rgba(240,237,232,0.3)", fontSize: 14 }}>No events in this feed.</p>
          ) : (
            alerts.map((a) => <AlertRow key={a.id} alert={a} />)
          )}
        </div>

        {/* Map */}
        <div className="glass rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          {isLoading ? (
            <MapSkeleton height={520} />
          ) : (
            <EventsMap data={alertsAsEq as Parameters<typeof EventsMap>[0]["data"]} height={520} />
          )}
        </div>
      </div>
    </div>
  );
}

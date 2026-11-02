"use client";
/* components/dashboard/Sidebar.tsx */
import { useState } from "react";
import { useFilters } from "@/lib/hooks/useFilters";
import type { TabId } from "./TabNav";

const REGIONS = [
  "Ring of Fire",
  "Alpine-Himalayan Belt",
  "Mid-Atlantic Ridge",
  "Other Regions",
];

function Label({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block mb-1 text-xs font-semibold tracking-widest uppercase"
      style={{ color: "rgba(240,237,232,0.6)", letterSpacing: "0.1em" }}
    >
      {children}
    </label>
  );
}

function SliderRow({
  id,
  label,
  min,
  max,
  step,
  value,
  onChange,
  unit = "",
}: {
  id: string;
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  unit?: string;
}) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <Label htmlFor={id}>{label}</Label>
        <span style={{ color: "var(--primary)", fontSize: 12, fontWeight: 600 }}>
          {value}
          {unit}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step ?? 0.1}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
        style={{ accentColor: "var(--primary)" }}
        aria-label={`${label}: ${value}${unit}`}
      />
    </div>
  );
}

export default function Sidebar({ activeTab = "general" }: { activeTab?: TabId }) {
  const { minMag, maxMag, minDepth, maxDepth, startDate, endDate, regions, set, reset } =
    useFilters();

  const [mobileOpen, setMobileOpen] = useState(false);

  function toggleRegion(region: string) {
    const next = regions.includes(region)
      ? regions.filter((r) => r !== region)
      : [...regions, region];
    set({ regions: next });
  }

  function selectAllRegions() {
    set({ regions: [...REGIONS] });
  }

  function clearRegions() {
    set({ regions: [] });
  }

  const isHistorical = activeTab === "historical" || activeTab === "advanced";
  const isAlerts = activeTab === "alerts";

  // Filter content markup reusable for both desktop and mobile drawer
  const filterControls = (
    <>
      {/* Contextual notice */}
      {isAlerts ? (
        <div
          className="mb-4 rounded-xl p-3 text-xs leading-relaxed"
          style={{
            background: "rgba(232, 87, 42, 0.08)",
            border: "1px solid rgba(232, 87, 42, 0.25)",
            color: "rgba(240, 237, 232, 0.8)",
          }}
        >
          Alerts tab uses preset USGS feeds. Sidebar filters do not alter alert feed windows.
        </div>
      ) : isHistorical ? (
        <div
          className="mb-4 rounded-xl p-3 text-xs leading-relaxed"
          style={{
            background: "rgba(0, 212, 255, 0.08)",
            border: "1px solid rgba(0, 212, 255, 0.25)",
            color: "rgba(240, 237, 232, 0.8)",
          }}
        >
          Historical Catalog: 2005–2025 records with magnitude M≥5.5.
        </div>
      ) : (
        <div
          className="mb-4 rounded-xl p-3 text-xs leading-relaxed"
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid var(--border)",
            color: "rgba(240, 237, 232, 0.7)",
          }}
        >
          Summary &amp; Geographic tabs display recent USGS rolling 30-day activity.
        </div>
      )}

      {/* Date range */}
      <div className="mb-5">
        <Label htmlFor="filter-start-date">Start date</Label>
        <input
          id="filter-start-date"
          type="date"
          value={startDate}
          onChange={(e) => set({ startDate: e.target.value })}
          className="w-full rounded-lg px-3 py-2 text-sm mb-2"
          suppressHydrationWarning
          aria-label="Filter start date"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid var(--border)",
            color: "var(--text)",
          }}
        />
        <Label htmlFor="filter-end-date">End date</Label>
        <input
          id="filter-end-date"
          type="date"
          value={endDate}
          onChange={(e) => set({ endDate: e.target.value })}
          className="w-full rounded-lg px-3 py-2 text-sm"
          suppressHydrationWarning
          aria-label="Filter end date"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid var(--border)",
            color: "var(--text)",
          }}
        />
      </div>

      {/* Magnitude range */}
      <SliderRow
        id="slider-min-mag"
        label="Min magnitude"
        min={isHistorical ? 5.5 : 0}
        max={10}
        step={0.1}
        value={minMag}
        onChange={(v) => set({ minMag: v })}
      />
      <SliderRow
        id="slider-max-mag"
        label="Max magnitude"
        min={0}
        max={10}
        step={0.1}
        value={maxMag}
        onChange={(v) => set({ maxMag: v })}
      />

      {/* Depth range */}
      <SliderRow
        id="slider-min-depth"
        label="Min depth"
        min={0}
        max={700}
        step={5}
        value={minDepth}
        onChange={(v) => set({ minDepth: v })}
        unit=" km"
      />
      <SliderRow
        id="slider-max-depth"
        label="Max depth"
        min={0}
        max={700}
        step={5}
        value={maxDepth}
        onChange={(v) => set({ maxDepth: v })}
        unit=" km"
      />

      {/* Regions */}
      <div className="mt-1">
        <div className="flex items-center justify-between mb-2">
          <Label>Tectonic regions</Label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={selectAllRegions}
              className="text-[10px] text-accent hover:underline"
              style={{ color: "var(--accent)" }}
            >
              All
            </button>
            <span style={{ color: "rgba(240,237,232,0.3)" }}>·</span>
            <button
              type="button"
              onClick={clearRegions}
              className="text-[10px] hover:underline"
              style={{ color: "rgba(240,237,232,0.6)" }}
            >
              Clear
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-2 mt-1">
          {REGIONS.map((r) => (
            <label
              key={r}
              className="flex items-center gap-2 cursor-pointer select-none"
              style={{ fontSize: 13, color: regions.includes(r) ? "var(--text)" : "rgba(240,237,232,0.5)" }}
            >
              <input
                type="checkbox"
                checked={regions.includes(r)}
                onChange={() => toggleRegion(r)}
                style={{ accentColor: "var(--primary)" }}
                aria-label={`Filter by region ${r}`}
              />
              {r}
            </label>
          ))}
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1 min-h-4" />

      {/* Active filters badge */}
      <div
        className="mt-6 rounded-xl px-4 py-3 text-center"
        style={{
          background: "rgba(232,87,42,0.08)",
          border: "1px solid rgba(232,87,42,0.25)",
        }}
      >
        <p className="text-xs" style={{ color: "rgba(240,237,232,0.6)", marginBottom: 4 }}>
          Active filter criteria
        </p>
        <p style={{ color: "var(--primary)", fontWeight: 700, fontSize: 13 }}>
          M {minMag.toFixed(1)}–{maxMag.toFixed(1)} · {minDepth}–{maxDepth} km
        </p>
        {regions.length > 0 && (
          <p className="text-[11px] mt-1" style={{ color: "var(--accent)" }}>
            {regions.length} region{regions.length > 1 ? "s" : ""} selected
          </p>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Collapsible Header (< lg) */}
      <div className="lg:hidden w-full glass p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs tracking-wider uppercase" style={{ color: "var(--text)" }}>
              Filters
            </span>
            <span
              className="px-2 py-0.5 rounded-full text-[11px] font-bold"
              style={{ background: "rgba(232,87,42,0.2)", color: "var(--primary)" }}
            >
              M {minMag.toFixed(1)}–{maxMag.toFixed(1)}
            </span>
            {regions.length > 0 && (
              <span
                className="px-2 py-0.5 rounded-full text-[11px] font-bold"
                style={{ background: "rgba(0,212,255,0.2)", color: "var(--accent)" }}
              >
                {regions.length} Reg
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={reset}
              className="text-xs px-2.5 py-1 rounded-lg"
              style={{
                background: "rgba(255,255,255,0.06)",
                color: "rgba(240,237,232,0.7)",
                border: "1px solid var(--border)",
              }}
            >
              Reset
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="text-xs px-3 py-1 rounded-lg font-medium"
              style={{
                background: mobileOpen ? "var(--primary)" : "rgba(232,87,42,0.15)",
                color: mobileOpen ? "#fff" : "var(--primary)",
                border: "1px solid rgba(232,87,42,0.3)",
              }}
            >
              {mobileOpen ? "Hide Filters ▲" : "Show Filters ▼"}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.08)] flex flex-col gap-0">
            {filterControls}
          </div>
        )}
      </div>

      {/* Desktop Sticky Sidebar (>= lg) */}
      <aside
        className="hidden lg:flex flex-col gap-0 overflow-y-auto glass shrink-0"
        style={{
          width: 264,
          minWidth: 264,
          borderRadius: 20,
          padding: "24px 20px",
          height: "calc(100vh - 96px)",
          position: "sticky",
          top: 24,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3
            className="font-semibold tracking-wider uppercase"
            style={{ color: "var(--text)", fontSize: 13 }}
          >
            Filters
          </h3>
          <button
            onClick={reset}
            className="text-xs px-3 py-1 rounded-lg transition-all"
            style={{
              background: "rgba(232,87,42,0.12)",
              color: "var(--primary)",
              border: "1px solid rgba(232,87,42,0.25)",
              cursor: "pointer",
            }}
          >
            Reset
          </button>
        </div>

        {filterControls}
      </aside>
    </>
  );
}

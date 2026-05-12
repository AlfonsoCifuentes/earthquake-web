"use client";
/* components/dashboard/Sidebar.tsx */
import { useFilters } from "@/lib/hooks/useFilters";
import type { FilterState } from "@/lib/types";

const REGIONS = [
  "Ring of Fire",
  "Alpine-Himalayan Belt",
  "Mid-Atlantic Ridge",
  "Other Regions",
];

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="block mb-1 text-xs font-semibold tracking-widest uppercase"
      style={{ color: "rgba(240,237,232,0.35)", letterSpacing: "0.1em" }}
    >
      {children}
    </span>
  );
}

function SliderRow({
  label,
  min,
  max,
  step,
  value,
  onChange,
  unit = "",
}: {
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
        <Label>{label}</Label>
        <span style={{ color: "var(--primary)", fontSize: 12, fontWeight: 600 }}>
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step ?? 0.1}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
        style={{ accentColor: "var(--primary)" }}
      />
    </div>
  );
}

export default function Sidebar() {
  const { minMag, maxMag, minDepth, maxDepth, startDate, endDate, regions, set, reset } =
    useFilters();

  function toggleRegion(region: string) {
    const next = regions.includes(region)
      ? regions.filter((r) => r !== region)
      : [...regions, region];
    set({ regions: next });
  }

  return (
    <aside
      className="glass flex flex-col gap-0 overflow-y-auto"
      style={{
        width: 264,
        minWidth: 264,
        borderRadius: 20,
        padding: "24px 20px",
        height: "calc(100vh - 96px)",
        position: "sticky",
        top: 24,
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
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

      {/* Date range */}
      <div className="mb-5">
        <Label>Start date</Label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => set({ startDate: e.target.value })}
          className="w-full rounded-lg px-3 py-2 text-sm mb-2"
          suppressHydrationWarning
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid var(--border)",
            color: "var(--text)",
          }}
        />
        <Label>End date</Label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => set({ endDate: e.target.value })}
          className="w-full rounded-lg px-3 py-2 text-sm"
          suppressHydrationWarning
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid var(--border)",
            color: "var(--text)",
          }}
        />
      </div>

      {/* Magnitude range */}
      <SliderRow
        label="Min magnitude"
        min={0}
        max={10}
        step={0.1}
        value={minMag}
        onChange={(v) => set({ minMag: v })}
      />
      <SliderRow
        label="Max magnitude"
        min={0}
        max={10}
        step={0.1}
        value={maxMag}
        onChange={(v) => set({ maxMag: v })}
      />

      {/* Depth range */}
      <SliderRow
        label="Min depth"
        min={0}
        max={700}
        step={5}
        value={minDepth}
        onChange={(v) => set({ minDepth: v })}
        unit=" km"
      />
      <SliderRow
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
        <Label>Tectonic regions</Label>
        <div className="flex flex-col gap-2 mt-2">
          {REGIONS.map((r) => (
            <label
              key={r}
              className="flex items-center gap-2 cursor-pointer select-none"
              style={{ fontSize: 13, color: regions.includes(r) ? "var(--text)" : "rgba(240,237,232,0.4)" }}
            >
              <input
                type="checkbox"
                checked={regions.includes(r)}
                onChange={() => toggleRegion(r)}
                style={{ accentColor: "var(--primary)" }}
              />
              {r}
            </label>
          ))}
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Stats footer */}
      <div
        className="mt-6 rounded-xl px-4 py-3 text-center"
        style={{
          background: "rgba(232,87,42,0.08)",
          border: "1px solid rgba(232,87,42,0.18)",
        }}
      >
        <p className="text-xs" style={{ color: "rgba(240,237,232,0.4)", marginBottom: 4 }}>
          Active filters
        </p>
        <p style={{ color: "var(--primary)", fontWeight: 700, fontSize: 15 }}>
          M {minMag.toFixed(1)}–{maxMag.toFixed(1)} · {minDepth}–{maxDepth}km
        </p>
      </div>
    </aside>
  );
}

"use client";
/* components/ui/Skeleton.tsx */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`shimmer ${className}`} />
  );
}

export function ChartSkeleton({ height = 320 }: { height?: number }) {
  return (
    <div
      className="shimmer rounded-2xl w-full"
      style={{ height }}
    />
  );
}

export function MapSkeleton({ height = 480 }: { height?: number }) {
  return (
    <div
      className="shimmer rounded-2xl w-full flex items-center justify-center"
      style={{ height }}
    >
      <span style={{ color: "var(--text-muted)" }} className="text-sm">
        Loading map…
      </span>
    </div>
  );
}

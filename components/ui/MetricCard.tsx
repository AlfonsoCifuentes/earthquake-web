"use client";
/* components/ui/MetricCard.tsx */
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface Props {
  label: string;
  value: number | string;
  unit?: string;
  icon?: React.ReactNode;
  color?: string;
  decimals?: number;
}

export default function MetricCard({
  label,
  value,
  unit = "",
  icon,
  color = "var(--primary)",
  decimals = 0,
}: Props) {
  const countRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (typeof value !== "number") return;
    const el = countRef.current;
    if (!el) return;
    const target = value;
    const duration = 1200;
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = (target * eased).toFixed(decimals);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, decimals]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass p-5 flex flex-col gap-2 relative overflow-hidden"
    >
      {/* glow accent */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl"
        style={{ background: `linear-gradient(90deg, ${color}, transparent)` }}
      />

      <div className="flex items-center gap-2 mb-1">
        {icon && <span style={{ color }}>{icon}</span>}
        <span
          className="text-xs tracking-widest uppercase font-semibold"
          style={{ color: "var(--text-muted)" }}
        >
          {label}
        </span>
      </div>

      <div className="flex items-end gap-1">
        <span
          className="text-4xl font-bold leading-none"
          style={{ fontFamily: "var(--font-space)", color }}
          ref={typeof value === "number" ? countRef : undefined}
        >
          {typeof value === "number" ? value.toFixed(decimals) : value}
        </span>
        {unit && (
          <span
            className="text-sm mb-1"
            style={{ color: "var(--text-muted)" }}
          >
            {unit}
          </span>
        )}
      </div>
    </motion.div>
  );
}

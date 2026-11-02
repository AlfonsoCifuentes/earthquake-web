"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

type Particle = { id: number; left: string; delay: string; duration: string; size: string };

const STATS = [
  { value: "9.7K+", label: "Historical M≥5.5 Events" },
  { value: "20 yrs", label: "Catalog (2005–2025)" },
  { value: "Real-time", label: "USGS Feed Monitoring" },
  { value: "Global", label: "Worldwide Coverage" },
];

export default function HeroSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 22 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 8}s`,
        duration: `${8 + Math.random() * 10}s`,
        size: `${2 + Math.random() * 3}px`,
      }))
    );
  }, []);

  /* ── Subtle canvas seismic waveform ──────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let raf: number;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = "rgba(232, 87, 42, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.shadowColor = "rgba(232, 87, 42, 0.6)";
      ctx.shadowBlur = 8;
      ctx.beginPath();

      const segments = Math.ceil(width / 3);
      for (let x = 0; x < segments; x++) {
        const xPos = x * 3;
        const offset = (xPos + frame) * 0.04;
        const amp =
          Math.sin(offset) * 12 +
          Math.sin(offset * 2.3) * 6 +
          Math.sin(offset * 5.7 + 1) * 3;
        const y = height / 2 + amp;
        x === 0 ? ctx.moveTo(xPos, y) : ctx.lineTo(xPos, y);
      }
      ctx.stroke();
      frame += 1;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <section className="relative min-h-screen w-full overflow-hidden flex items-center justify-center">
      {/* ── Background Photo ────────────────────────── */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/images/volcano.jpg')",
        }}
      />

      {/* ── Multi-layer gradient overlay ─────────────── */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/95" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(232,87,42,0.18) 0%, transparent 70%)",
        }}
      />

      {/* ── Floating particles ────────────────────────── */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full opacity-0 pointer-events-none"
          style={{
            left: p.left,
            bottom: "-4px",
            width: p.size,
            height: p.size,
            background: "var(--primary)",
            animation: `particle-drift ${p.duration} ${p.delay} ease-in infinite`,
          }}
        />
      ))}

      {/* ── Seismic canvas ───────────────────────────── */}
      <canvas
        ref={canvasRef}
        className="absolute bottom-32 left-0 right-0 w-full pointer-events-none"
        style={{ height: "80px" }}
      />

      {/* ── Main content ─────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-5xl mx-auto pt-16 pb-36">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <span
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-widest uppercase mb-8"
            style={{
              background: "rgba(232,87,42,0.15)",
              border: "1px solid rgba(232,87,42,0.4)",
              color: "var(--primary)",
              backdropFilter: "blur(12px)",
            }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            USGS Global Feed Active
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.15, ease: "easeOut" }}
          className="font-bold leading-none tracking-tight mb-6"
          style={{
            fontFamily: "var(--font-space)",
            fontSize: "clamp(3.5rem, 10vw, 8rem)",
          }}
        >
          <span className="gradient-text-hot">SEISMIC</span>
          <br />
          <span style={{ color: "var(--text)" }}>ATLAS</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-lg md:text-xl max-w-2xl leading-relaxed mb-12"
          style={{ color: "rgba(240,237,232,0.85)" }}
        >
          Explore global earthquake records, recent USGS activity and historical seismic patterns through interactive maps and data visualizations.
        </motion.p>

        {/* CTA Button — Valid single Link without nested button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.45 }}
        >
          <Link
            href="/dashboard"
            className="relative group inline-flex items-center gap-3 px-10 py-4 rounded-2xl font-bold text-lg tracking-wide overflow-hidden transition-all duration-300"
            style={{
              background:
                "linear-gradient(135deg, var(--primary) 0%, #c94020 100%)",
              color: "white",
              fontFamily: "var(--font-space)",
              boxShadow:
                "0 0 40px rgba(232,87,42,0.5), 0 8px 32px rgba(0,0,0,0.4)",
              textDecoration: "none",
            }}
          >
            <span className="relative z-10 flex items-center gap-3">
              Explore the Atlas
              <svg
                className="w-5 h-5 transition-transform group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </span>
            {/* Hover shimmer */}
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          </Link>
        </motion.div>
      </div>

      {/* ── Stats bar ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.7 }}
        className="absolute bottom-0 left-0 right-0"
        style={{
          background: "rgba(6,6,8,0.9)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between flex-wrap gap-4">
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col items-center">
              <span
                className="text-2xl font-bold"
                style={{
                  fontFamily: "var(--font-space)",
                  color: "var(--primary)",
                }}
              >
                {s.value}
              </span>
              <span
                className="text-xs tracking-widest uppercase mt-0.5 text-center"
                style={{ color: "rgba(240,237,232,0.65)" }}
              >
                {s.label}
              </span>
            </div>
          ))}
          <div
            className="hidden md:block h-8 w-px"
            style={{ background: "var(--border)" }}
          />
          <div className="text-xs" style={{ color: "rgba(240,237,232,0.65)" }}>
            Data verified from{" "}
            <span style={{ color: "var(--accent)" }}>USGS Earthquake Hazards Program</span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

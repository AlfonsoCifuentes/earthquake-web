"use client";
/* components/ui/Badge.tsx */

const VARIANTS = {
  critical: { bg: "rgba(255,59,48,0.18)", color: "#ff3b30", border: "rgba(255,59,48,0.35)" },
  high:     { bg: "rgba(255,149,0,0.15)", color: "#ff9500", border: "rgba(255,149,0,0.35)" },
  moderate: { bg: "rgba(255,214,10,0.12)", color: "#ffd60a", border: "rgba(255,214,10,0.3)" },
  low:      { bg: "rgba(48,209,88,0.12)", color: "#30d158", border: "rgba(48,209,88,0.3)" },
  default:  { bg: "rgba(255,255,255,0.06)", color: "var(--text-muted)", border: "var(--border)" },
};

interface Props {
  children: React.ReactNode;
  variant?: keyof typeof VARIANTS;
  size?: "sm" | "md";
}

export default function Badge({ children, variant = "default", size = "sm" }: Props) {
  const v = VARIANTS[variant];
  return (
    <span
      className="inline-flex items-center font-semibold tracking-wide rounded-full"
      style={{
        background: v.bg,
        color: v.color,
        border: `1px solid ${v.border}`,
        padding: size === "sm" ? "2px 8px" : "4px 12px",
        fontSize: size === "sm" ? "0.68rem" : "0.78rem",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
      }}
    >
      {children}
    </span>
  );
}

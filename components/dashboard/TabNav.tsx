"use client";
/* components/dashboard/TabNav.tsx */
import { motion } from "framer-motion";

export type TabId = "general" | "geographic" | "temporal" | "advanced" | "alerts" | "historical";

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  { id: "general",    label: "Summary",      icon: "◎" },
  { id: "geographic", label: "Geographic",   icon: "◉" },
  { id: "temporal",   label: "Temporal",     icon: "◷" },
  { id: "advanced",   label: "Advanced",     icon: "◈" },
  { id: "alerts",     label: "Alerts",       icon: "◈" },
  { id: "historical", label: "Historical",   icon: "◎" },
];

interface Props {
  active: TabId;
  onChange: (id: TabId) => void;
}

export default function TabNav({ active, onChange }: Props) {
  return (
    <nav
      className="flex gap-1 p-1 rounded-2xl"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)" }}
    >
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2"
            style={{
              color: isActive ? "#f0ede8" : "rgba(240,237,232,0.45)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {isActive && (
              <motion.span
                layoutId="tab-indicator"
                className="absolute inset-0 rounded-xl"
                style={{
                  background: "linear-gradient(135deg, rgba(232,87,42,0.3), rgba(232,87,42,0.12))",
                  border: "1px solid rgba(232,87,42,0.35)",
                }}
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative z-10 text-xs">{tab.icon}</span>
            <span className="relative z-10">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

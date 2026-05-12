"use client";
/* components/dashboard/DashboardLayout.tsx */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import TabNav, { type TabId } from "./TabNav";
import Sidebar from "./Sidebar";

/* Tab content — lazy */
import dynamic from "next/dynamic";
const GeneralTab    = dynamic(() => import("./tabs/GeneralTab"),    { ssr: false });
const GeographicTab = dynamic(() => import("./tabs/GeographicTab"), { ssr: false });
const TemporalTab   = dynamic(() => import("./tabs/TemporalTab"),   { ssr: false });
const AdvancedTab   = dynamic(() => import("./tabs/AdvancedTab"),   { ssr: false });
const AlertsTab     = dynamic(() => import("./tabs/AlertsTab"),     { ssr: false });
const HistoricalTab = dynamic(() => import("./tabs/HistoricalTab"), { ssr: false });

const TAB_COMPONENTS: Record<TabId, React.ComponentType> = {
  general:    GeneralTab,
  geographic: GeographicTab,
  temporal:   TemporalTab,
  advanced:   AdvancedTab,
  alerts:     AlertsTab,
  historical: HistoricalTab,
};

export default function DashboardLayout() {
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const TabContent = TAB_COMPONENTS[activeTab];

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      {/* Top bar */}
      <header
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{
          borderColor: "var(--border)",
          background: "rgba(6,6,8,0.9)",
          backdropFilter: "blur(16px)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <Link href="/" style={{ textDecoration: "none" }}>
          <div className="flex items-center gap-3">
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "var(--primary)",
                boxShadow: "0 0 10px var(--primary)",
                display: "inline-block",
              }}
            />
            <span
              className="font-bold tracking-widest uppercase"
              style={{ color: "var(--text)", fontSize: 15, fontFamily: "var(--font-space)" }}
            >
              Seismic Atlas
            </span>
          </div>
        </Link>

        <div className="overflow-x-auto max-w-full">
          <TabNav active={activeTab} onChange={setActiveTab} />
        </div>

        {/* Live badge */}
        <div className="flex items-center gap-2">
          <span
            className="inline-block"
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#30d158",
              boxShadow: "0 0 8px #30d158",
              animation: "pulse 2s ease-in-out infinite",
            }}
          />
          <span style={{ color: "rgba(240,237,232,0.5)", fontSize: 12 }}>LIVE</span>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex gap-6 px-6 pt-6 pb-10 max-w-screen-2xl mx-auto">
        <Sidebar />

        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              <TabContent />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

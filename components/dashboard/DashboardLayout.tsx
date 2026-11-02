"use client";
/* components/dashboard/DashboardLayout.tsx */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import TabNav, { type TabId } from "./TabNav";
import Sidebar from "./Sidebar";
import { useRealtimeData } from "@/lib/hooks/useEarthquakeData";

/* Tab content — lazy loaded */
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

  // Dynamic feed status
  const { data: realtimeData, isLoading: realtimeLoading, isError: realtimeError } = useRealtimeData();

  const isDegraded = realtimeError || realtimeData?.stale;

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      {/* Top bar */}
      <header
        className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b"
        style={{
          borderColor: "var(--border)",
          background: "rgba(6,6,8,0.92)",
          backdropFilter: "blur(16px)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <Link href="/" style={{ textDecoration: "none" }}>
          <div className="flex items-center gap-2.5">
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
              className="font-bold tracking-widest uppercase text-sm sm:text-base"
              style={{ color: "var(--text)", fontFamily: "var(--font-space)" }}
            >
              Seismic Atlas
            </span>
          </div>
        </Link>

        {/* Tab navigation */}
        <div className="overflow-x-auto max-w-[calc(100vw-220px)] sm:max-w-none px-2">
          <TabNav active={activeTab} onChange={setActiveTab} />
        </div>

        {/* Dynamic status badge */}
        <div className="flex items-center gap-2 shrink-0">
          {realtimeLoading ? (
            <>
              <span
                className="inline-block"
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#888",
                }}
              />
              <span style={{ color: "rgba(240,237,232,0.6)", fontSize: 11 }} className="hidden sm:inline">
                CONNECTING...
              </span>
            </>
          ) : isDegraded ? (
            <>
              <span
                className="inline-block"
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#ff9500",
                  boxShadow: "0 0 8px #ff9500",
                }}
              />
              <span
                title={realtimeData?.warning || "USGS feed degraded; showing cached fallback"}
                style={{ color: "#ff9500", fontSize: 11, fontWeight: 600 }}
              >
                CACHED SNAPSHOT
              </span>
            </>
          ) : (
            <>
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
              <span
                title={`Live USGS feed active (${realtimeData?.count ?? 0} events loaded)`}
                style={{ color: "#30d158", fontSize: 11, fontWeight: 600 }}
              >
                USGS LIVE
              </span>
            </>
          )}
        </div>
      </header>

      {/* Main content area: responsive layout */}
      <div className="mx-auto flex max-w-screen-2xl flex-col gap-4 px-3 sm:px-4 pt-4 pb-10 lg:flex-row lg:gap-6 lg:px-6">
        <Sidebar activeTab={activeTab} />

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

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info, Lightbulb, ChevronDown, ChevronUp } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass";

interface ReportNoticeProps {
  title: string;
  purpose: string;
  tracking: string[];
  icon?: React.ComponentType<{ className?: string }>;
  reportId: string;
}

export function ReportNotice({
  title,
  purpose,
  tracking,
  icon: Icon = Info,
  reportId,
}: ReportNoticeProps) {
  // State
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Storage key
  const storageKey = `quelyos_report_notice_collapsed_${reportId}`;

  // Hydration-safe initialization
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        setIsCollapsed(stored === "true");
      }
    } catch (error) {
      console.error("Failed to load notice preference:", error);
    }

    setMounted(true);
  }, [storageKey]);

  // Toggle handler with persistence
  const handleToggle = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);

    try {
      localStorage.setItem(storageKey, String(newState));
    } catch (error) {
      console.error("Failed to save notice preference:", error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="mb-6"
    >
      <AnimatePresence mode="wait">
        {mounted && isCollapsed ? (
          // Collapsed State
          <motion.div
            key="collapsed"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <GlassPanel className="p-0" gradient="indigo">
              <button
                onClick={handleToggle}
                aria-label="Développer les informations du rapport"
                aria-expanded={false}
                className="w-full px-5 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
              >
                <div className="rounded-lg bg-indigo-500/20 p-2 flex-shrink-0">
                  <Icon className="h-4 w-4 text-indigo-300" />
                </div>
                <span className="flex-1 text-sm font-medium text-indigo-100">
                  À propos de ce rapport
                </span>
                <ChevronDown className="h-4 w-4 text-indigo-300 flex-shrink-0" />
              </button>
            </GlassPanel>
          </motion.div>
        ) : mounted ? (
          // Expanded State
          <motion.div
            key="expanded"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <GlassPanel className="p-5" gradient="indigo">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-indigo-500/20 p-2 flex-shrink-0">
                  <Icon className="h-5 w-5 text-indigo-300" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base font-semibold text-white">
                      À propos de ce rapport
                    </h3>
                    <button
                      onClick={handleToggle}
                      aria-label="Masquer les informations du rapport"
                      aria-expanded={true}
                      className="rounded-full p-1.5 hover:bg-white/10 transition-colors"
                    >
                      <ChevronUp className="h-4 w-4 text-indigo-300" />
                    </button>
                  </div>

                  {/* Purpose */}
                  <div className="mb-3">
                    <p className="text-sm text-indigo-100 leading-relaxed">
                      {purpose}
                    </p>
                  </div>

                  {/* Tracking recommendations */}
                  <div className="rounded-lg bg-white/5 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="h-4 w-4 text-yellow-300" />
                      <span className="text-sm font-medium text-white">
                        Pour un suivi fiable
                      </span>
                    </div>
                    <ul className="space-y-1.5">
                      {tracking.map((item, index) => (
                        <li
                          key={index}
                          className="text-xs text-slate-200 flex items-start gap-2"
                        >
                          <span className="text-indigo-300 mt-0.5 flex-shrink-0">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </GlassPanel>
          </motion.div>
        ) : (
          // Loading State (prevents hydration mismatch)
          <GlassPanel className="p-5" gradient="indigo">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-indigo-500/20 p-2 flex-shrink-0">
                <Icon className="h-5 w-5 text-indigo-300" />
              </div>
              <div className="flex-1">
                <h3 className="mb-2 text-base font-semibold text-white">
                  À propos de ce rapport
                </h3>
                <div className="mb-3">
                  <p className="text-sm text-indigo-100 leading-relaxed">
                    {purpose}
                  </p>
                </div>
                <div className="rounded-lg bg-white/5 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="h-4 w-4 text-yellow-300" />
                    <span className="text-sm font-medium text-white">
                      Pour un suivi fiable
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {tracking.map((item, index) => (
                      <li
                        key={index}
                        className="text-xs text-slate-200 flex items-start gap-2"
                      >
                        <span className="text-indigo-300 mt-0.5 flex-shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </GlassPanel>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown } from "lucide-react";
import { logger } from '@quelyos/logger';
import type { PageNoticeConfig, Notice } from "@/lib/notices";
import type { PageNoticeConfig as PageNoticeConfigType, NoticeSection } from "@/lib/notices/types";
import { MODULE_COLOR_CONFIGS } from "@/lib/notices/types";
import {
  trackNoticeView,
  trackNoticeExpansion,
  trackNoticeCollapse,
  trackNoticeFeedback,
  getNoticeFeedback,
} from "@/lib/notices/analytics";

interface PageNoticeProps {
  config?: PageNoticeConfig | Notice[];
  className?: string;
  enableFeedback?: boolean; // Activer le système de feedback (default: true)
}

export function PageNotice({ config, className = "", enableFeedback = true }: PageNoticeProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [feedbackValue, setFeedbackValue] = useState<boolean | null>(null);

  // Support ancien format Notice[] : convertir en PageNoticeConfig (memoized)
  const normalizedConfig: PageNoticeConfigType | null = useMemo(() => {
    if (!config) return null;
    return Array.isArray(config)
      ? {
          pageId: 'legacy-notice',
          title: config[0]?.title || 'Information',
          purpose: config[0]?.message || '',
          sections: [],
          moduleColor: 'gray',
        }
      : config;
  }, [config]);

  const Icon = normalizedConfig?.icon || Info;
  const colorConfig = MODULE_COLOR_CONFIGS[normalizedConfig?.moduleColor || 'gray' as keyof typeof MODULE_COLOR_CONFIGS];
  const storageKey = `quelyos_page_notice_collapsed_${normalizedConfig?.pageId || 'default'}`;

  // Hydration-safe initialization
  useEffect(() => {
    // Protection : si config est undefined, ne rien faire
    if (!normalizedConfig) {
      return;
    }
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        setIsCollapsed(stored === "true");
      }

      // Charger feedback existant
      if (enableFeedback) {
        const existingFeedback = getNoticeFeedback(normalizedConfig.pageId);
        if (existingFeedback) {
          setFeedbackGiven(true);
          setFeedbackValue(existingFeedback.isHelpful);
        }
      }

      // Tracker la vue
      trackNoticeView(normalizedConfig.pageId);
    } catch (error) {
      logger.error("Failed to load notice preference:", error);
    }

    setMounted(true);
  }, [storageKey, normalizedConfig, enableFeedback]);

  // Toggle handler with persistence + analytics
  const handleToggle = () => {
    if (!normalizedConfig) return;

    const newState = !isCollapsed;
    setIsCollapsed(newState);

    try {
      localStorage.setItem(storageKey, String(newState));

      // Tracker l'action
      if (newState) {
        trackNoticeCollapse(normalizedConfig.pageId);
      } else {
        trackNoticeExpansion(normalizedConfig.pageId);
      }
    } catch (error) {
      logger.error("Failed to save notice preference:", error);
    }
  };

  // Handler feedback utilisateur
  const handleFeedback = (isHelpful: boolean) => {
    if (!normalizedConfig) return;

    try {
      trackNoticeFeedback(normalizedConfig.pageId, isHelpful);
      setFeedbackGiven(true);
      setFeedbackValue(isHelpful);
      logger.info(`Notice feedback: ${normalizedConfig.pageId} - ${isHelpful ? 'helpful' : 'not helpful'}`);
    } catch (error) {
      logger.error("Failed to submit feedback:", error);
    }
  };

  // Protection défensive : si config est undefined, ne rien afficher
  if (!normalizedConfig) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className={className}
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
            <div className={`border ${colorConfig.border} ${colorConfig.bg} rounded-xl backdrop-blur-sm p-0`}>
              <button
                onClick={handleToggle}
                aria-label={`Développer les informations - ${normalizedConfig.title}`}
                aria-expanded={false}
                className="w-full px-5 py-3 flex items-center gap-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
              >
                <div className={`rounded-lg ${colorConfig.iconBg} p-2 flex-shrink-0`}>
                  <Icon className={`h-4 w-4 ${colorConfig.iconText}`} />
                </div>
                <span className={`flex-1 text-sm font-medium ${colorConfig.textPrimary}`}>
                  À propos - {normalizedConfig.title}
                </span>
                <ChevronDown className={`h-4 w-4 ${colorConfig.iconText} flex-shrink-0`} />
              </button>
            </div>
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
            <div className={`border ${colorConfig.border} ${colorConfig.bg} rounded-xl backdrop-blur-sm p-5`}>
              <div className="flex items-start gap-3">
                <div className={`rounded-lg ${colorConfig.iconBg} p-2 flex-shrink-0`}>
                  <Icon className={`h-5 w-5 ${colorConfig.iconText}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`text-base font-semibold ${colorConfig.textPrimary}`}>
                      {normalizedConfig.title}
                    </h3>
                    <button
                      onClick={handleToggle}
                      aria-label={`Masquer les informations - ${normalizedConfig.title}`}
                      aria-expanded={true}
                      className="rounded-full p-1.5 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    >
                      <ChevronUp className={`h-4 w-4 ${colorConfig.iconText}`} />
                    </button>
                  </div>

                  {/* Purpose */}
                  <div className="mb-3">
                    <p className={`text-sm ${colorConfig.textSecondary} leading-relaxed`}>
                      {normalizedConfig.purpose}
                    </p>
                  </div>

                  {/* Sections */}
                  {normalizedConfig.sections?.map((section: NoticeSection, sectionIndex: number) => {
                    const SectionIcon = section.icon;
                    return (
                      <div key={sectionIndex} className={sectionIndex > 0 ? "mt-3" : ""}>
                        <div className="rounded-lg bg-black/5 dark:bg-white/5 p-3">
                          <div className="flex items-center gap-2 mb-2">
                            {SectionIcon && <SectionIcon className={`h-4 w-4 ${colorConfig.iconText}`} />}
                            <span className={`text-sm font-medium ${colorConfig.textPrimary}`}>
                              {section.title}
                            </span>
                          </div>
                          <ul className="space-y-1.5">
                            {section.items.map((item: string, itemIndex: number) => (
                              <li
                                key={itemIndex}
                                className={`text-xs ${colorConfig.textSecondary} flex items-start gap-2`}
                              >
                                <span className={`${colorConfig.bullet} mt-0.5 flex-shrink-0`}>•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    );
                  })}

                  {/* Feedback Section */}
                  {enableFeedback && (
                    <div className={`mt-4 pt-3 border-t ${colorConfig.border}`}>
                      {!feedbackGiven ? (
                        <div className="flex items-center justify-between">
                          <span className={`text-xs ${colorConfig.textSecondary}`}>
                            Ces informations vous sont-elles utiles ?
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleFeedback(true)}
                              aria-label="Oui, c'est utile"
                              className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors group"
                            >
                              <ThumbsUp className={`h-3.5 w-3.5 ${colorConfig.textSecondary} group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors`} />
                              <span className={`text-xs ${colorConfig.textSecondary} group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors`}>
                                Oui
                              </span>
                            </button>
                            <button
                              onClick={() => handleFeedback(false)}
                              aria-label="Non, pas utile"
                              className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors group"
                            >
                              <ThumbsDown className={`h-3.5 w-3.5 ${colorConfig.textSecondary} group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors`} />
                              <span className={`text-xs ${colorConfig.textSecondary} group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors`}>
                                Non
                              </span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {feedbackValue ? (
                            <>
                              <ThumbsUp className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                              <span className="text-xs text-green-600 dark:text-green-400">
                                Merci pour votre retour positif !
                              </span>
                            </>
                          ) : (
                            <>
                              <ThumbsDown className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                              <span className="text-xs text-red-600 dark:text-red-400">
                                Merci pour votre retour. Nous travaillons à améliorer ce contenu.
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          // Loading State (prevents hydration mismatch)
          <div className={`border ${colorConfig.border} ${colorConfig.bg} rounded-xl backdrop-blur-sm p-5`}>
            <div className="flex items-start gap-3">
              <div className={`rounded-lg ${colorConfig.iconBg} p-2 flex-shrink-0`}>
                <Icon className={`h-5 w-5 ${colorConfig.iconText}`} />
              </div>
              <div className="flex-1">
                <h3 className={`mb-2 text-base font-semibold ${colorConfig.textPrimary}`}>
                  {normalizedConfig.title}
                </h3>
                <div className="mb-3">
                  <p className={`text-sm ${colorConfig.textSecondary} leading-relaxed`}>
                    {normalizedConfig.purpose}
                  </p>
                </div>
                {normalizedConfig.sections?.map((section: NoticeSection, sectionIndex: number) => {
                  const SectionIcon = section.icon;
                  return (
                    <div key={sectionIndex} className={sectionIndex > 0 ? "mt-3" : ""}>
                      <div className="rounded-lg bg-black/5 dark:bg-white/5 p-3">
                        <div className="flex items-center gap-2 mb-2">
                          {SectionIcon && <SectionIcon className={`h-4 w-4 ${colorConfig.iconText}`} />}
                          <span className={`text-sm font-medium ${colorConfig.textPrimary}`}>
                            {section.title}
                          </span>
                        </div>
                        <ul className="space-y-1.5">
                          {section.items.map((item: string, itemIndex: number) => (
                            <li
                              key={itemIndex}
                              className={`text-xs ${colorConfig.textSecondary} flex items-start gap-2`}
                            >
                              <span className={`${colorConfig.bullet} mt-0.5 flex-shrink-0`}>•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}

                {/* Fallback for old format with features/actions */}
                {!normalizedConfig.sections && (config as unknown as { features?: Array<{ text: string }> }).features && (
                  <div className="mt-3">
                    <ul className="space-y-1.5">
                      {(config as unknown as { features: Array<{ text: string }> }).features.map((feature: { text: string }, idx: number) => (
                        <li key={idx} className={`text-xs ${colorConfig.textSecondary} flex items-start gap-2`}>
                          <span className={`${colorConfig.bullet} mt-0.5 flex-shrink-0`}>•</span>
                          <span>{feature.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

"use client";

import React from "react";
import { AlertTriangle, CheckCircle, XCircle, Info } from "lucide-react";
import { AnimatePresence, ScaleInBounce, Hoverable } from "@quelyos/ui/animated";
import { LazyMotion, domAnimation, m } from "framer-motion";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "success" | "info";
  icon?: React.ReactNode;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  variant = "warning",
  icon,
}: ConfirmDialogProps) {
  const variantStyles = {
    danger: {
      icon: <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />,
      confirmBg: "bg-red-600 hover:bg-red-700",
      border: "border-red-200 dark:border-red-500/20",
      bg: "bg-red-100 dark:bg-red-500/10",
    },
    warning: {
      icon: <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />,
      confirmBg: "bg-amber-600 hover:bg-amber-700",
      border: "border-amber-200 dark:border-amber-500/20",
      bg: "bg-amber-100 dark:bg-amber-500/10",
    },
    success: {
      icon: <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />,
      confirmBg: "bg-green-600 hover:bg-green-700",
      border: "border-green-200 dark:border-green-500/20",
      bg: "bg-green-100 dark:bg-green-500/10",
    },
    info: {
      icon: <Info className="h-6 w-6 text-blue-600 dark:text-blue-400" />,
      confirmBg: "bg-blue-600 hover:bg-blue-700",
      border: "border-blue-200 dark:border-blue-500/20",
      bg: "bg-blue-100 dark:bg-blue-500/10",
    },
  };

  const styles = variantStyles[variant];

  return (
    <LazyMotion features={domAnimation}>
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <ScaleInBounce className="relative w-full max-w-md mx-4">
            <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gradient-to-b dark:from-slate-900 dark:to-slate-800 p-6 shadow-2xl">
              <div className="flex items-start gap-4">
                <div className={`rounded-lg p-2 ${styles.bg} border ${styles.border}`}>
                  {icon || styles.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
                  <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                    {message}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex gap-3 justify-end">
                <Hoverable enableScale>
                  <button
                    onClick={onClose}
                    className="rounded-xl px-5 py-2.5 text-sm font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 border border-gray-300 dark:border-white/10 transition"
                  >
                    {cancelText}
                  </button>
                </Hoverable>
                <Hoverable enableScale>
                  <button
                    onClick={() => {
                      onConfirm();
                      onClose();
                    }}
                    className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition ${styles.confirmBg}`}
                  >
                    {confirmText}
                  </button>
                </Hoverable>
              </div>
            </div>
          </ScaleInBounce>
        </div>
      )}
    </AnimatePresence>
    </LazyMotion>
  );
}

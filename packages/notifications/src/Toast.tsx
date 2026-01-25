/**
 * Component Toast pour afficher les notifications
 */

"use client";

import React from "react";
import type { Notification, NotificationPosition } from "./types";
import { useNotifications } from "./NotificationProvider";

interface ToastContainerProps {
  position?: NotificationPosition;
  maxNotifications?: number;
}

export function ToastContainer({
  position = "top-right",
  maxNotifications = 5,
}: ToastContainerProps) {
  const { notifications, hideNotification } = useNotifications();

  const displayedNotifications = notifications.slice(-maxNotifications);

  const positionClasses: Record<NotificationPosition, string> = {
    "top-left": "top-4 left-4",
    "top-center": "top-4 left-1/2 -translate-x-1/2",
    "top-right": "top-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
    "bottom-right": "bottom-4 right-4",
  };

  return (
    <div
      className={`fixed z-50 flex flex-col gap-2 ${positionClasses[position]}`}
      style={{ maxWidth: "420px", width: "calc(100vw - 2rem)" }}
    >
      {displayedNotifications.map((notification) => (
        <Toast
          key={notification.id}
          notification={notification}
          onClose={() => hideNotification(notification.id)}
        />
      ))}
    </div>
  );
}

interface ToastProps {
  notification: Notification;
  onClose: () => void;
}

function Toast({ notification, onClose }: ToastProps) {
  const { type, title, message, action } = notification;

  const typeStyles: Record<string, string> = {
    success: "bg-green-50 border-green-200 text-green-900",
    error: "bg-red-50 border-red-200 text-red-900",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-900",
    info: "bg-blue-50 border-blue-200 text-blue-900",
  };

  const iconStyles: Record<string, string> = {
    success: "text-green-500",
    error: "text-red-500",
    warning: "text-yellow-500",
    info: "text-blue-500",
  };

  const icons: Record<string, string> = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ",
  };

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg animate-in slide-in-from-top-2 ${typeStyles[type]}`}
      role="alert"
    >
      {/* Icon */}
      <div
        className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-white ${iconStyles[type]}`}
      >
        <span className="text-sm font-bold">{icons[type]}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && <div className="font-semibold text-sm mb-1">{title}</div>}
        <div className="text-sm">{message}</div>
        {action && (
          <button
            onClick={action.onClick}
            className="mt-2 text-sm font-medium underline hover:no-underline"
          >
            {action.label}
          </button>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Fermer"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}

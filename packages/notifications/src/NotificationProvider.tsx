/**
 * Context React pour les notifications
 */

"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import type {
  Notification,
  NotificationType,
  NotificationOptions,
  NotificationContextValue,
} from "./types";

const NotificationContext = createContext<NotificationContextValue | null>(
  null
);

function generateId(): string {
  return `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

interface NotificationProviderProps {
  children: ReactNode;
  defaultDuration?: number;
}

export function NotificationProvider({
  children,
  defaultDuration = 5000,
}: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback(
    (
      type: NotificationType,
      message: string,
      options?: NotificationOptions
    ): string => {
      const id = generateId();
      const notification: Notification = {
        id,
        type,
        message,
        title: options?.title,
        duration: options?.duration ?? defaultDuration,
        action: options?.action,
        onClose: options?.onClose,
      };

      setNotifications((prev) => [...prev, notification]);

      // Auto-hide après duration
      if (notification.duration && notification.duration > 0) {
        setTimeout(() => {
          hideNotification(id);
        }, notification.duration);
      }

      return id;
    },
    [defaultDuration]
  );

  const hideNotification = useCallback((id: string) => {
    setNotifications((prev) => {
      const notification = prev.find((n) => n.id === id);
      if (notification?.onClose) {
        notification.onClose();
      }
      return prev.filter((n) => n.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const success = useCallback(
    (message: string, options?: NotificationOptions) =>
      showNotification("success", message, options),
    [showNotification]
  );

  const error = useCallback(
    (message: string, options?: NotificationOptions) =>
      showNotification("error", message, options),
    [showNotification]
  );

  const warning = useCallback(
    (message: string, options?: NotificationOptions) =>
      showNotification("warning", message, options),
    [showNotification]
  );

  const info = useCallback(
    (message: string, options?: NotificationOptions) =>
      showNotification("info", message, options),
    [showNotification]
  );

  const value: NotificationContextValue = {
    notifications,
    showNotification,
    hideNotification,
    clearAll,
    success,
    error,
    warning,
    info,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within NotificationProvider"
    );
  }
  return context;
}

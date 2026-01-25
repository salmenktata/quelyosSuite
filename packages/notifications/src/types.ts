/**
 * Types pour le système de notifications
 */

export type NotificationType = "success" | "error" | "warning" | "info";
export type NotificationPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export interface Notification {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
}

export interface NotificationOptions {
  title?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
}

export interface NotificationContextValue {
  notifications: Notification[];
  showNotification: (
    type: NotificationType,
    message: string,
    options?: NotificationOptions
  ) => string;
  hideNotification: (id: string) => void;
  clearAll: () => void;
  success: (message: string, options?: NotificationOptions) => string;
  error: (message: string, options?: NotificationOptions) => string;
  warning: (message: string, options?: NotificationOptions) => string;
  info: (message: string, options?: NotificationOptions) => string;
}

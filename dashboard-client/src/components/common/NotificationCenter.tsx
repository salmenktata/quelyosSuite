/**
 * Notification Center - Orchestrateur Notifications Temps Réel
 *
 * Fonctionnalités :
 * - Écoute WebSocket global (invoices, orders, stock, notifications)
 * - Affiche toasts Sonner automatiques
 * - Badge compteur notifications non lues
 * - Popover historique 10 dernières notifications
 * - Invalidation cache TanStack Query
 */

import { useState, useEffect } from 'react';
import { Bell, BellRing, CheckCircle, AlertCircle, Package, FileText } from 'lucide-react';
import { useInvoiceNotifications, useWebSocketStatus } from '@/hooks/useInvoiceNotifications';
import type { WSMessage } from '@/lib/websocket';

export interface NotificationCenterProps {
  /**
   * Afficher icône avec badge compteur
   * @default true
   */
  showIcon?: boolean;

  /**
   * Position icon
   * @default "header"
   */
  position?: 'header' | 'sidebar' | 'floating';

  /**
   * Activer toasts automatiques
   * @default true
   */
  enableToasts?: boolean;
}

interface StoredNotification {
  id: string;
  channel: string;
  event: string;
  data: Record<string, unknown>;
  timestamp: string;
  read: boolean;
}

/**
 * Notification Center Component
 *
 * @example
 * <NotificationCenter position="header" />
 */
export function NotificationCenter({
  showIcon = true,
  position = 'header',
  enableToasts = true,
}: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<StoredNotification[]>([]);
  const [showPopover, setShowPopover] = useState(false);
  const { isConnected } = useWebSocketStatus();

  // Écouter notifications invoices
  useInvoiceNotifications({
    onInvoiceCreated: enableToasts ? undefined : () => {}, // Toast auto si enableToasts
    onInvoicePaid: (data) => {
      addNotification({
        channel: 'invoices',
        event: 'invoice.paid',
        data,
      });
    },
    onInvoiceOverdue: (data) => {
      addNotification({
        channel: 'invoices',
        event: 'invoice.overdue',
        data,
      });
    },
  });

  // Ajouter notification à l'historique
  const addNotification = (message: Omit<WSMessage, 'id' | 'timestamp'>) => {
    const notification: StoredNotification = {
      id: crypto.randomUUID(),
      channel: message.channel || 'general',
      event: message.event || 'notification',
      data: (message.data as Record<string, unknown>) || {},
      timestamp: new Date().toISOString(),
      read: false,
    };

    setNotifications((prev) => {
      // Max 10 notifications
      const updated = [notification, ...prev].slice(0, 10);
      // Sauvegarder en localStorage
      localStorage.setItem('notifications', JSON.stringify(updated));
      return updated;
    });
  };

  // Charger notifications depuis localStorage
  useEffect(() => {
    const stored = localStorage.getItem('notifications');
    if (stored) {
      try {
        setNotifications(JSON.parse(stored));
      } catch (error) {
        console.error('[NotificationCenter] Parse error:', error);
      }
    }
  }, []);

  // Marquer toutes comme lues
  const markAllAsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      localStorage.setItem('notifications', JSON.stringify(updated));
      return updated;
    });
  };

  // Compter non lues
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Icône selon channel
  const getIcon = (channel: string) => {
    switch (channel) {
      case 'invoices':
        return <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      case 'orders':
        return <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case 'stock':
        return <Package className="w-4 h-4 text-orange-600 dark:text-orange-400" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  // Formater message notification
  const formatNotificationMessage = (notification: StoredNotification): string => {
    const { event, data } = notification;

    switch (event) {
      case 'invoice.paid':
        return `Paiement reçu : ${data.name || 'Facture'}`;
      case 'invoice.overdue':
        return `Facture en retard : ${data.name || 'N/A'}`;
      case 'invoice.created':
        return `Nouvelle facture : ${data.name || 'N/A'}`;
      case 'invoice.validated':
        return `Facture validée : ${data.name || 'N/A'}`;
      case 'order.new':
        return `Nouvelle commande : ${data.name || 'N/A'}`;
      case 'stock.low':
        return `Stock faible : ${data.product_name || 'Produit'}`;
      default:
        return `Notification : ${event}`;
    }
  };

  // Formater timestamp
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffMins < 1440) return `Il y a ${Math.floor(diffMins / 60)}h`;
    return date.toLocaleDateString('fr-FR');
  };

  if (!showIcon) {
    return null;
  }

  return (
    <div className="relative">
      {/* Icon avec badge */}
      <button
        onClick={() => setShowPopover(!showPopover)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title="Notifications"
      >
        {isConnected ? (
          <BellRing className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        ) : (
          <Bell className="w-5 h-5 text-gray-400 dark:text-gray-600" />
        )}

        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}

        {/* Pulse indicator si connecté */}
        {isConnected && unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          </span>
        )}
      </button>

      {/* Popover historique */}
      {showPopover && (
        <>
          {/* Overlay pour fermer */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowPopover(false)}
          />

          {/* Contenu popover */}
          <div className="absolute right-0 top-full mt-2 w-80 max-w-sm z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Tout marquer lu
                </button>
              )}
            </div>

            {/* Liste notifications */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Aucune notification</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        !notification.read
                          ? 'bg-indigo-50 dark:bg-indigo-900/20'
                          : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getIcon(notification.channel)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {formatNotificationMessage(notification)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {formatTimestamp(notification.timestamp)}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="flex-shrink-0">
                            <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center">
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                {isConnected ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Connecté - Temps réel activé</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>Déconnecté</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Variante compacte pour header
 */
export function NotificationIcon() {
  return <NotificationCenter showIcon={true} position="header" />;
}

/**
 * Variante sidebar
 */
export function NotificationSidebar() {
  return <NotificationCenter showIcon={true} position="sidebar" />;
}

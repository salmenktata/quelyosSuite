/**
 * Système d'événements pour l'authentification
 * Permet aux apps de réagir aux événements d'auth sans couplage fort
 */

type AuthEventType =
  | "login"
  | "logout"
  | "token_refresh"
  | "session_expired"
  | "auth_error";

interface AuthEventData {
  login: { userId: string; email: string };
  logout: { userId: string };
  token_refresh: { success: boolean };
  session_expired: { userId: string };
  auth_error: { error: Error; context?: string };
}

type EventListener<T extends AuthEventType> = (data: AuthEventData[T]) => void;

class AuthEventEmitter {
  private listeners: Map<AuthEventType, Set<EventListener<any>>> = new Map();

  /**
   * Écouter un événement d'authentification
   */
  on<T extends AuthEventType>(
    event: T,
    listener: EventListener<T>
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)!.add(listener);

    // Retourner une fonction pour se désabonner
    return () => {
      this.listeners.get(event)?.delete(listener);
    };
  }

  /**
   * Émettre un événement d'authentification
   */
  emit<T extends AuthEventType>(event: T, data: AuthEventData[T]): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in auth event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Se désabonner de tous les listeners d'un événement
   */
  off(event: AuthEventType): void {
    this.listeners.delete(event);
  }

  /**
   * Se désabonner de tous les événements
   */
  removeAllListeners(): void {
    this.listeners.clear();
  }
}

// Export singleton
export const authEvents = new AuthEventEmitter();

/**
 * Hook React pour écouter les événements d'auth
 */
export function useAuthEvent<T extends AuthEventType>(
  event: T,
  listener: EventListener<T>
): void {
  if (typeof window === "undefined") return;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { useEffect } = require("react");

  useEffect(() => {
    const unsubscribe = authEvents.on(event, listener);
    return unsubscribe;
  }, [event, listener]);
}

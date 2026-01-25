/**
 * Logger structuré pour le système d'authentification
 * Fournit des logs cohérents avec contexte pour debugging et monitoring
 */

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogContext {
  email?: string;
  userId?: string;
  sessionId?: string;
  [key: string]: unknown;
}

class AuthLogger {
  private isDev = process.env.NODE_ENV === "development";

  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      category: "AUTH",
      message,
      ...context,
    };

    if (this.isDev) {
      // Format lisible en développement
      const emoji = {
        info: "ℹ️",
        warn: "⚠️",
        error: "❌",
        debug: "🔍",
      }[level];

      console.log(
        `${emoji} [${timestamp}] [AUTH] ${message}`,
        context ? context : ""
      );
    } else {
      // JSON structuré en production pour parsing
      console.log(JSON.stringify(logData));
    }
  }

  // Événements de login
  loginAttempt(email: string) {
    this.log("info", "Login attempt", { email });
  }

  loginSuccess(userId: string, email: string) {
    this.log("info", "Login successful", { userId, email });
  }

  loginFailure(email: string, reason: string) {
    this.log("warn", "Login failed", { email, reason });
  }

  // Événements de logout
  logoutInitiated(userId: string) {
    this.log("info", "Logout initiated", { userId });
  }

  logoutSuccess(userId: string) {
    this.log("info", "Logout successful", { userId });
  }

  // Événements de tokens
  tokenRefreshAttempt() {
    this.log("debug", "Token refresh attempt");
  }

  tokenRefreshSuccess() {
    this.log("debug", "Token refresh successful");
  }

  tokenRefreshFailure(reason: string) {
    this.log("warn", "Token refresh failed", { reason });
  }

  // Événements de validation
  validationSuccess(userId: string) {
    this.log("debug", "Auth validation successful", { userId });
  }

  validationFailure(reason: string) {
    this.log("debug", "Auth validation failed", { reason });
  }

  // Erreurs
  error(message: string, error: Error, context?: LogContext) {
    this.log("error", message, {
      ...context,
      error: error.message,
      stack: this.isDev ? error.stack : undefined,
    });
  }

  // Session
  sessionExpired(userId: string) {
    this.log("info", "Session expired", { userId });
  }

  sessionWarning(userId: string, timeRemaining: number) {
    this.log("info", "Session expiring soon", { userId, timeRemaining });
  }
}

// Export singleton
export const authLogger = new AuthLogger();

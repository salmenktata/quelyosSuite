"use client";

import React, { Component, ReactNode } from "react";
import { authLogger } from "./logger";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary pour gérer les erreurs d'authentification
 * Attrape les erreurs liées à l'auth et affiche une UI de secours
 */
export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Logger l'erreur
    authLogger.error("Auth error caught by boundary", error, {
      componentStack: errorInfo.componentStack,
    });

    // Appeler le callback personnalisé si fourni
    this.props.onError?.(error, errorInfo);

    // Si c'est une erreur d'auth critique, rediriger vers login
    if (this.isAuthError(error)) {
      setTimeout(() => {
        if (typeof window !== "undefined") {
          window.location.href = "/login?reason=auth_error";
        }
      }, 2000);
    }
  }

  private isAuthError(error: Error): boolean {
    const authErrorPatterns = [
      "authentication",
      "unauthorized",
      "token",
      "session",
      "auth",
    ];

    const errorMessage = error.message.toLowerCase();
    return authErrorPatterns.some((pattern) => errorMessage.includes(pattern));
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Utiliser le fallback personnalisé si fourni
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // UI de secours par défaut
      return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
          <div className="mx-4 max-w-md rounded-lg bg-white/10 p-8 text-center backdrop-blur-xl">
            <div className="mb-4 text-6xl">🔒</div>
            <h1 className="mb-2 text-2xl font-bold text-white">
              Erreur d'authentification
            </h1>
            <p className="mb-6 text-slate-300">
              {this.state.error?.message ||
                "Une erreur s'est produite lors de la vérification de votre authentification."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition hover:bg-indigo-700"
              >
                Réessayer
              </button>
              <button
                onClick={() => (window.location.href = "/login")}
                className="flex-1 rounded-lg bg-white/10 px-4 py-2 font-medium text-white transition hover:bg-white/20"
              >
                Retour à la connexion
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

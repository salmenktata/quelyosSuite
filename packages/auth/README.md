# @quelyos/auth v2.0

> Système d'authentification unifié et sécurisé pour toutes les applications Quelyos

## 🎯 Fonctionnalités

✅ **Sécurité maximale** - Cookies httpOnly, refresh automatique, CSRF protection
✅ **Sans boucles** - Architecture testée sans redirections infinies
✅ **Middleware Next.js** - Protection automatique des routes
✅ **Error Boundaries** - Gestion élégante des erreurs d'auth
✅ **Logging structuré** - Débogage facile avec contexte complet
✅ **Système d'événements** - React aux événements auth (analytics, cleanup)
✅ **Configuration centralisée** - Un seul endroit pour tout configurer
✅ **TypeScript** - Types complets et sûrs

## 🚀 Quick Start

### 1. Wrapper votre app

```tsx
// app/layout.tsx
import { AuthProvider, AuthErrorBoundary } from "@quelyos/auth";

export default function RootLayout({ children }) {
  return (
    <AuthErrorBoundary>
      <AuthProvider apiBaseUrl="http://localhost:3004/api/v1">
        {children}
      </AuthProvider>
    </AuthErrorBoundary>
  );
}
```

### 2. Créer un middleware

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("accessToken");
  
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

### 3. Protéger un layout

```tsx
// app/dashboard/layout.tsx
"use client";
import { useRequireAuth } from "@quelyos/auth";

export default function DashboardLayout({ children }) {
  const { user, isLoading } = useRequireAuth();
  
  if (isLoading) return <LoadingSpinner />;
  if (!user) return null; // Redirection en cours
  
  return <div>{children}</div>;
}
```

### 4. Page de login

```tsx
"use client";
import { useAuth } from "@quelyos/auth";

function LoginPage() {
  const { login } = useAuth();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      // Redirection automatique vers /dashboard
    } catch (error) {
      console.error(error);
    }
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

## 📚 API Complète

### Hooks

#### `useAuth()`
Accès au contexte d'authentification.

```tsx
const { user, isLoading, login, logout, fetchWithAuth } = useAuth();
```

#### `useRequireAuth()`
Protège une page - redirige si non authentifié.

```tsx
const { user, isLoading } = useRequireAuth();
```

#### `useAuthEvent(event, callback)`
Écoute les événements d'authentification.

```tsx
useAuthEvent("login", ({ userId }) => {
  console.log("User logged in:", userId);
});
```

### Composants

#### `<AuthProvider>`
Provider principal.

```tsx
<AuthProvider apiBaseUrl="http://api.example.com">
  {children}
</AuthProvider>
```

#### `<AuthErrorBoundary>`
Attrape les erreurs d'authentification.

```tsx
<AuthErrorBoundary fallback={<CustomError />}>
  {children}
</AuthErrorBoundary>
```

### Utilitaires

#### `authLogger`
Logger structuré pour debugging.

```typescript
import { authLogger } from "@quelyos/auth";

authLogger.loginAttempt(email);
authLogger.loginSuccess(userId, email);
authLogger.error("Auth failed", error);
```

#### `authEvents`
Système d'événements global.

```typescript
import { authEvents } from "@quelyos/auth";

authEvents.on("login", ({ userId }) => {
  // Analytics, cleanup, etc.
});

authEvents.on("logout", () => {
  // Nettoyer les données
});
```

#### `authConfig`
Configuration centralisée.

```typescript
import { authConfig } from "@quelyos/auth";

console.log(authConfig.tokens.refreshInterval); // 10 minutes
console.log(authConfig.ui.redirectAfterLogin);   // "/dashboard"
```

## 🔐 Architecture de Sécurité

### Protection en couches

1. **Middleware Next.js** - Première ligne de défense
2. **AuthProvider** - Gestion d'état et tokens
3. **Error Boundary** - Gestion des erreurs
4. **Hooks de protection** - `useRequireAuth()` dans les layouts

### Tokens

- **accessToken** (15min) - Cookie httpOnly, SameSite=Strict
- **refreshToken** (7j) - Cookie httpOnly, stocké en DB
- **Refresh automatique** - Tous les 10 minutes en arrière-plan

## 📊 Événements Disponibles

```typescript
type AuthEventType = 
  | "login"              // { userId, email }
  | "logout"             // { userId }
  | "token_refresh"      // { success }
  | "session_expired"    // { userId }
  | "auth_error"         // { error, context }
```

## 🎨 Exemples d'Usage

### Analytics tracking

```tsx
import { useAuthEvent } from "@quelyos/auth";

function MyApp() {
  useAuthEvent("login", ({ userId }) => {
    gtag("event", "login", { user_id: userId });
  });
  
  return <App />;
}
```

### Cleanup au logout

```tsx
authEvents.on("logout", () => {
  localStorage.clear();
  sessionStorage.clear();
});
```

### Monitoring

```tsx
authEvents.on("token_refresh", ({ success }) => {
  if (!success) {
    Sentry.captureMessage("Token refresh failed");
  }
});
```

## 🧪 Testing

```typescript
import { render } from "@testing-library/react";
import { AuthProvider } from "@quelyos/auth";

test("protected route", () => {
  render(
    <AuthProvider>
      <ProtectedComponent />
    </AuthProvider>
  );
});
```

## 📝 Migration Guide

### Depuis l'ancien système

1. Remplacer les imports:
```diff
- import { useAuth } from "@/components/AuthProvider"
+ import { useAuth } from "@quelyos/auth"
```

2. Ajouter le middleware
3. Wrapper avec `<AuthErrorBoundary>`
4. Retirer les logiques de redirection manuelles

## 🚀 Changelog

### v2.0.0 - Refonte complète
- ✅ Architecture sans boucles
- ✅ Middleware Next.js
- ✅ Error boundaries
- ✅ Logging structuré
- ✅ Système d'événements
- ✅ Configuration centralisée

## 📞 Support

Voir la documentation complète: `/docs/auth/`

# @quelyos/api-client

> Client API unifié pour toutes les applications Quelyos

## 🎯 Fonctionnalités

✅ **Cookies httpOnly** - Support natif pour authentification sécurisée
✅ **Timeout configurable** - Évite les requêtes qui traînent
✅ **Error handling unifié** - Gestion cohérente des erreurs
✅ **Logging structuré** - Debug facile avec logs clairs
✅ **TypeScript** - Types complets et sûrs
✅ **Retry automatique** - Réessaie en cas d'échec réseau
✅ **Callbacks** - Hooks pour 401, erreurs, etc.

## 🚀 Installation

```bash
npm install @quelyos/api-client
```

## 📚 Usage

### Configuration de base

```typescript
import { createApiClient } from "@quelyos/api-client";

const apiClient = createApiClient({
  baseUrl: "http://localhost:3004/api/v1",
  timeout: 30000, // 30 secondes
  credentials: "include", // Envoie les cookies
  onUnauthorized: () => {
    // Rediriger vers /login
    window.location.href = "/login";
  },
});
```

### Méthodes HTTP

```typescript
// GET
const users = await apiClient.get("/users");

// POST
const newUser = await apiClient.post("/users", {
  email: "user@example.com",
  name: "John Doe",
});

// PUT
const updated = await apiClient.put("/users/1", {
  name: "Jane Doe",
});

// PATCH
const patched = await apiClient.patch("/users/1", {
  email: "jane@example.com",
});

// DELETE
await apiClient.delete("/users/1");
```

### Options avancées

```typescript
// Timeout personnalisé
const data = await apiClient.get("/slow-endpoint", {
  timeout: 60000, // 60 secondes
});

// Headers personnalisés
const data = await apiClient.post("/users", userData, {
  headers: {
    "X-Custom-Header": "value",
  },
});

// Signal d'annulation
const controller = new AbortController();
const promise = apiClient.get("/users", {
  signal: controller.signal,
});

// Annuler après 5 secondes
setTimeout(() => controller.abort(), 5000);
```

### Gestion des erreurs

```typescript
import type { ApiError } from "@quelyos/api-client";

try {
  const data = await apiClient.get("/users");
} catch (error) {
  const apiError = error as ApiError;

  if (apiError.isTimeout) {
    console.error("La requête a timeout");
  } else if (apiError.isNetworkError) {
    console.error("Erreur réseau");
  } else if (apiError.status === 404) {
    console.error("Ressource non trouvée");
  } else {
    console.error("Erreur:", apiError.message);
  }
}
```

### Avec React

```typescript
import { createApiClient } from "@quelyos/api-client";
import { useRouter } from "next/navigation";

function MyComponent() {
  const router = useRouter();

  const apiClient = createApiClient({
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
    onUnauthorized: () => {
      router.push("/login");
    },
  });

  const loadData = async () => {
    try {
      const data = await apiClient.get("/data");
      setData(data);
    } catch (error) {
      console.error(error);
    }
  };

  return <button onClick={loadData}>Load</button>;
}
```

## 🔧 Configuration

### ApiClientConfig

| Option           | Type                        | Défaut      | Description                                 |
| ---------------- | --------------------------- | ----------- | ------------------------------------------- |
| `baseUrl`        | `string`                    | -           | URL de base de l'API (requis)               |
| `timeout`        | `number`                    | `30000`     | Timeout en ms                               |
| `credentials`    | `RequestCredentials`        | `"include"` | Mode credentials (include/same-origin/omit) |
| `headers`        | `Record<string, string>`    | `{}`        | Headers par défaut                          |
| `onUnauthorized` | `() => void`                | `() => {}`  | Callback sur 401                            |
| `onError`        | `(error: ApiError) => void` | `() => {}`  | Callback sur erreur                         |

## 📖 API Reference

### ApiClient

#### Méthodes

- `get<T>(endpoint: string, options?: ApiRequestOptions): Promise<T>`
- `post<T>(endpoint: string, data?: unknown, options?: ApiRequestOptions): Promise<T>`
- `put<T>(endpoint: string, data?: unknown, options?: ApiRequestOptions): Promise<T>`
- `patch<T>(endpoint: string, data?: unknown, options?: ApiRequestOptions): Promise<T>`
- `delete<T>(endpoint: string, options?: ApiRequestOptions): Promise<T>`
- `updateConfig(config: Partial<ApiClientConfig>): void`

## 🎨 Exemples

### Authentification

```typescript
const apiClient = createApiClient({
  baseUrl: "http://localhost:3004/api/v1",
  onUnauthorized: () => {
    // L'utilisateur n'est plus authentifié
    localStorage.removeItem("user");
    window.location.href = "/login";
  },
});

// Login
const { user, token } = await apiClient.post("/auth/login", {
  email: "user@example.com",
  password: "password123",
});

// Les requêtes suivantes incluent automatiquement le cookie
const profile = await apiClient.get("/users/me");
```

### Pagination

```typescript
interface PaginatedResponse<T> {
  data: T[];
  page: number;
  total: number;
}

const users = await apiClient.get<PaginatedResponse<User>>(
  "/users?page=1&limit=10"
);

console.log(`Page ${users.page} sur ${Math.ceil(users.total / 10)}`);
```

### Upload de fichiers

```typescript
const formData = new FormData();
formData.append("file", file);

const response = await apiClient.post("/upload", formData, {
  headers: {
    // Laisser le navigateur définir Content-Type avec boundary
    "Content-Type": "multipart/form-data",
  },
});
```

## 🚀 Migration

### Depuis apps/finance/lib/api.ts

```diff
- import { api } from "@/lib/api";
+ import { createApiClient } from "@quelyos/api-client";
+
+ const apiClient = createApiClient({
+   baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "/api/proxy"
+ });

- const data = await api("/users");
+ const data = await apiClient.get("/users");
```

### Depuis apps/marketing/lib/api.ts

```diff
- import { apiGet, apiPost } from "@/lib/api";
+ import { createApiClient } from "@quelyos/api-client";
+
+ const apiClient = createApiClient({
+   baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3004"
+ });

- const data = await apiGet("/users");
+ const data = await apiClient.get("/users");

- const created = await apiPost("/users", userData);
+ const created = await apiClient.post("/users", userData);
```

## 📝 Changelog

### v1.0.0

- ✅ Client API de base avec GET/POST/PUT/PATCH/DELETE
- ✅ Support cookies httpOnly
- ✅ Timeout configurable
- ✅ Error handling unifié
- ✅ Callbacks onUnauthorized et onError
- ✅ Types TypeScript complets

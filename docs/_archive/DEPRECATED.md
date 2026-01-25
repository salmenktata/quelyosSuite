# ⚠️ DEPRECATED - @quelyos/auth

**Status**: DEPRECATED  
**Date**: 12 décembre 2025  
**Raison**: Vulnérabilités de sécurité (localStorage XSS)

---

## 🚫 Ne Plus Utiliser

Ce package utilisait `localStorage` pour stocker les tokens JWT, ce qui est **vulnérable aux attaques XSS**.

## ✅ Utiliser à la Place

### Marketing App
```tsx
import { useAuth } from '@/components/AuthProvider';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();
  // ...
}
```

### Finance App
```tsx
import { useAuth } from '@/components/AuthProvider';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();
  // ...
}
```

### API Requests
```tsx
// Les cookies httpOnly sont envoyés automatiquement
const response = await fetch('http://localhost:3004/api/endpoint', {
  credentials: 'include' // ✅ Important
});
```

---

## 🔒 Nouvelle Architecture Sécurisée

1. **Tokens en cookies httpOnly** - Protection XSS
2. **CORS credentials=true** - Cookies cross-origin
3. **SameSite=Strict** - Protection CSRF
4. **RefreshToken en DB** - Révocation possible
5. **Pas de localStorage** - Aucun accès JS aux tokens

---

## 📝 Migration Guide

Si vous utilisez encore ce package:

1. Supprimer l'import `@quelyos/auth`
2. Utiliser `AuthProvider` de l'app respective
3. Remplacer `getToken()` par `credentials: 'include'`
4. Supprimer tous les `localStorage.getItem("token")`

---

*Ce package est conservé pour référence historique uniquement.*  
*Ne pas utiliser dans du nouveau code.*

# @quelyos/notifications

> Système de notifications unifié (toasts, bannières, badges) pour toutes les applications Quelyos

## 🎯 Fonctionnalités

- ✅ **Toasts** : Notifications temporaires (success, error, warning, info)
- ✅ **Positions configurables** : 6 positions disponibles (top/bottom × left/center/right)
- ✅ **Auto-dismiss** : Durée configurable par notification
- ✅ **Actions** : Boutons d'action optionnels
- ✅ **Callbacks** : onClose pour chaque notification
- ✅ **API simple** : success(), error(), warning(), info()
- ✅ **TypeScript** : Types complets
- ✅ **Tailwind CSS** : Styles prêts à l'emploi
- ✅ **Animations** : Entrée/sortie fluides

## 🚀 Installation

```bash
npm install @quelyos/notifications
```

## 📚 Usage

### 1. Setup Provider

Wrap your app with `NotificationProvider` :

```typescript
// app/layout.tsx
import { NotificationProvider, ToastContainer } from "@quelyos/notifications";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <NotificationProvider defaultDuration={5000}>
          {children}
          <ToastContainer position="top-right" maxNotifications={5} />
        </NotificationProvider>
      </body>
    </html>
  );
}
```

### 2. Utiliser dans vos components

```typescript
"use client";

import { useNotifications } from "@quelyos/notifications";

export function MyComponent() {
  const { success, error, warning, info } = useNotifications();

  const handleSave = async () => {
    try {
      await saveData();
      success("Données enregistrées avec succès !");
    } catch (err) {
      error("Erreur lors de l'enregistrement");
    }
  };

  return <button onClick={handleSave}>Enregistrer</button>;
}
```

### 3. Notifications avec options

```typescript
const { showNotification } = useNotifications();

// Avec titre
success("Profil mis à jour", {
  title: "Succès",
  duration: 3000,
});

// Avec action
error("Échec de connexion", {
  title: "Erreur",
  action: {
    label: "Réessayer",
    onClick: () => retryConnection(),
  },
});

// Avec callback onClose
info("Mise à jour disponible", {
  duration: 0, // Ne se ferme pas automatiquement
  onClose: () => console.log("Notification fermée"),
});

// Notification manuelle
showNotification("warning", "Stock faible", {
  title: "Attention",
  duration: 10000,
});
```

### 4. Gestion programmatique

```typescript
const { hideNotification, clearAll } = useNotifications();

// Obtenir l'ID de la notification
const notifId = success("En cours...");

// Fermer manuellement
setTimeout(() => {
  hideNotification(notifId);
}, 2000);

// Tout fermer
clearAll();
```

## 🎨 Positions disponibles

```typescript
type NotificationPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

// Usage
<ToastContainer position="bottom-right" />
```

## 🎨 Customisation

### Styles Tailwind

Les toasts utilisent Tailwind CSS. Vous pouvez personnaliser les couleurs dans votre `tailwind.config.js` :

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        green: {
          /* vos couleurs success */
        },
        red: {
          /* vos couleurs error */
        },
        yellow: {
          /* vos couleurs warning */
        },
        blue: {
          /* vos couleurs info */
        },
      },
    },
  },
};
```

### Component personnalisé

Si vous voulez un style complètement custom, vous pouvez créer votre propre composant :

```typescript
import { useNotifications } from "@quelyos/notifications";

function MyCustomToast() {
  const { notifications, hideNotification } = useNotifications();

  return (
    <div className="custom-container">
      {notifications.map((notif) => (
        <div key={notif.id} className="custom-toast">
          {notif.message}
          <button onClick={() => hideNotification(notif.id)}>×</button>
        </div>
      ))}
    </div>
  );
}
```

## 🔧 API Reference

### NotificationProvider Props

```typescript
interface NotificationProviderProps {
  children: ReactNode;
  defaultDuration?: number; // Défaut: 5000ms
}
```

### ToastContainer Props

```typescript
interface ToastContainerProps {
  position?: NotificationPosition; // Défaut: "top-right"
  maxNotifications?: number; // Défaut: 5
}
```

### useNotifications Hook

```typescript
interface NotificationContextValue {
  notifications: Notification[];
  showNotification: (type, message, options?) => string;
  hideNotification: (id: string) => void;
  clearAll: () => void;
  success: (message: string, options?) => string;
  error: (message: string, options?) => string;
  warning: (message: string, options?) => string;
  info: (message: string, options?) => string;
}
```

### NotificationOptions

```typescript
interface NotificationOptions {
  title?: string;
  duration?: number; // 0 = ne se ferme pas automatiquement
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
}
```

## 📝 Exemples

### Notification de chargement

```typescript
const notifId = info("Chargement en cours...", { duration: 0 });

try {
  await fetchData();
  hideNotification(notifId);
  success("Données chargées !");
} catch {
  hideNotification(notifId);
  error("Échec du chargement");
}
```

### Notification persistante

```typescript
// Ne se ferme que manuellement
const notifId = warning("Connexion perdue", {
  title: "Attention",
  duration: 0,
  action: {
    label: "Reconnecter",
    onClick: () => reconnect(),
  },
});
```

### Confirmation d'action

```typescript
const handleDelete = () => {
  success("Élément supprimé", {
    duration: 5000,
    action: {
      label: "Annuler",
      onClick: () => {
        undoDelete();
        info("Suppression annulée");
      },
    },
  });
};
```

## 📝 Changelog

### v1.0.0

- ✅ NotificationProvider avec context React
- ✅ Hook useNotifications
- ✅ ToastContainer avec 6 positions
- ✅ 4 types de notifications (success, error, warning, info)
- ✅ Actions optionnelles
- ✅ Auto-dismiss configurable
- ✅ Callbacks onClose
- ✅ Gestion programmatique (hide, clearAll)
- ✅ Animations Tailwind
- ✅ Types TypeScript complets

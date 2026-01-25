# 🚀 Guide Simple Multi-Tenant (Query Params)

## ✅ Solution la plus simple : Query Params

**Pas besoin de modifier `/etc/hosts` !**

Utilisez simplement des query params dans l'URL :
```
http://localhost:3000?tenant=CODE_TENANT
```

---

## 📝 Étape 1 : Créer 2 Tenants dans Odoo

### 1.1 Accéder à Odoo
```
http://localhost:8069
```

### 1.2 Créer Tenant 1

```
Menu → Quelyos → Tenants / Boutiques → Créer
```

**Remplir** :
- **Nom boutique** : `Boutique Sport`
- **Code unique** : `sport` ⭐ (important !)
- **Domaine principal** : `localhost` (ou n'importe quoi)
- **Société** : Votre company actuelle
- **Couleur primaire** : `#3b82f6` (Bleu)

**Sauvegarder**

### 1.3 Créer Tenant 2

```
Créer un nouveau tenant
```

**Remplir** :
- **Nom boutique** : `Marque Mode`
- **Code unique** : `mode` ⭐ (important !)
- **Domaine principal** : `localhost` (ou n'importe quoi)
- **Société** : Créer nouvelle company "Marque Mode"
- **Couleur primaire** : `#ec4899` (Rose)

**Sauvegarder**

---

## 🔄 Étape 2 : Redémarrer le Frontend

Le middleware a été modifié, il faut redémarrer :

```bash
# Arrêter le frontend (Ctrl+C dans le terminal)

# Relancer
cd frontend
npm run dev
```

---

## 🌐 Étape 3 : Tester les 2 Tenants

### Tenant 1 - Boutique Sport
```
http://localhost:3000?tenant=sport
```

**Vérifications** :
- ✅ Couleur bleue
- ✅ Nom : "Boutique Sport"

### Tenant 2 - Marque Mode
```
http://localhost:3000?tenant=mode
```

**Vérifications** :
- ✅ Couleur rose
- ✅ Nom : "Marque Mode"

---

## 🎯 Comment ça fonctionne

```
URL : http://localhost:3000?tenant=sport
                                      ↓
                    Middleware détecte query param
                                      ↓
                    Set cookie: tenant_code=sport
                                      ↓
                    TenantProvider charge config "sport"
                                      ↓
                    Frontend affiche Boutique Sport
```

---

## 🔍 Débogage

### Le tenant ne charge pas

**Vider le cache** :
```
Cmd+Shift+R (macOS) ou Ctrl+Shift+R (Windows/Linux)
```

**Vérifier le cookie (Console F12)** :
```javascript
document.cookie
// Devrait contenir: tenant_code=sport ou tenant_code=mode
```

**Forcer le changement de tenant** :
```javascript
// Console navigateur
document.cookie = "tenant_code=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/"
// Puis recharger avec le nouveau ?tenant=...
```

### Erreur "Tenant non trouvé"

**Vérifier que le code existe dans Odoo** :
```
Quelyos → Tenants / Boutiques → Tous les Tenants
→ Vérifier que le "Code unique" correspond exactement
```

**Tester l'API directement** :
```bash
curl "http://localhost:8069/api/ecommerce/tenant/sport"
# Devrait retourner {"success": true, "tenant": {...}}
```

---

## 📊 Résumé URLs

| Tenant | Code | URL Frontend | URL Backoffice |
|--------|------|--------------|----------------|
| **Boutique Sport** | `sport` | http://localhost:3000?tenant=sport | http://localhost:5175/my-shop |
| **Marque Mode** | `mode` | http://localhost:3000?tenant=mode | http://localhost:5175/my-shop |

---

## 💡 Astuce

Vous pouvez créer des signets dans votre navigateur :
- **Sport** : http://localhost:3000?tenant=sport
- **Mode** : http://localhost:3000?tenant=mode

Et naviguer facilement entre les 2 boutiques !

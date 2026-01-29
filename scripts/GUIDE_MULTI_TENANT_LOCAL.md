# 🚀 Guide Multi-Tenant Local - Configuration Complète

## ✅ Checklist

- [ ] Modifier `/etc/hosts`
- [ ] Créer Tenant 1 dans Odoo
- [ ] Créer Tenant 2 dans Odoo
- [ ] Tester les 2 frontends

---

## 📝 Étape 1 : Configuration `/etc/hosts`

### Exécuter le script automatique

```bash
./scripts/setup-local-domains.sh
```

### OU Manuellement

```bash
sudo nano /etc/hosts
```

Ajouter à la fin :
```
# Quelyos ERP - Multi-tenant local
127.0.0.1  tenant1.local
127.0.0.1  tenant2.local
```

Sauvegarder : `Ctrl+O` → `Enter` → `Ctrl+X`

### Vérification

```bash
ping tenant1.local
ping tenant2.local
```

Devrait répondre avec `127.0.0.1`

---

## 🏢 Étape 2 : Créer Tenant 1 dans Odoo

### 2.1 Accéder à Odoo

```
http://localhost:8069
```

### 2.2 Naviguer vers les Tenants

```
Menu → Quelyos → Tenants / Boutiques → Tous les Tenants → Créer
```

### 2.3 Remplir le formulaire

**Onglet Principal**

| Champ | Valeur |
|-------|--------|
| **Nom boutique** | `Boutique Sport` |
| **Code unique** | `boutiquesport` |
| **Domaine principal** | `tenant1.local` ⭐ |
| **Domaine backoffice** | `localhost:5175` |
| **Société** | Créer nouvelle : "Boutique Sport SA" |
| **Plan tarifaire** | Starter |
| **Email Admin** | `admin@tenant1.local` |

**Onglet Branding**

| Champ | Valeur |
|-------|--------|
| **Slogan** | `Votre équipement sportif de qualité` |
| **Police** | Inter |

**Onglet Couleurs**

| Champ | Valeur (Thème Sport - Bleu/Vert) |
|-------|----------------------------------|
| **Couleur primaire** | `#3b82f6` (Bleu) |
| **Couleur secondaire** | `#10b981` (Vert) |
| **Accent** | `#f59e0b` (Orange) |

**Onglet Contact**

| Champ | Valeur |
|-------|--------|
| **Email** | `contact@tenant1.local` |
| **Téléphone** | `+33 1 23 45 67 89` |

**Onglet Options**

| Option | Valeur |
|--------|--------|
| ✅ Wishlist | Activé |
| ✅ Comparaison | Activé |
| ✅ Avis clients | Activé |
| ✅ Newsletter | Activé |
| ✅ Mode sombre | Activé |

### 2.4 Sauvegarder

Cliquez sur **Enregistrer**

---

## 🏢 Étape 3 : Créer Tenant 2 dans Odoo

### 3.1 Créer un nouveau tenant

```
Quelyos → Tenants / Boutiques → Créer
```

### 3.2 Remplir le formulaire

**Onglet Principal**

| Champ | Valeur |
|-------|--------|
| **Nom boutique** | `Marque Mode` |
| **Code unique** | `marquemode` |
| **Domaine principal** | `tenant2.local` ⭐ |
| **Domaine backoffice** | `localhost:5175` |
| **Société** | Créer nouvelle : "Marque Mode SAS" |
| **Plan tarifaire** | Pro |
| **Email Admin** | `admin@tenant2.local` |

**Onglet Branding**

| Champ | Valeur |
|-------|--------|
| **Slogan** | `L'élégance à la française` |
| **Police** | Poppins |

**Onglet Couleurs**

| Champ | Valeur (Thème Mode - Rose/Violet) |
|-------|-----------------------------------|
| **Couleur primaire** | `#ec4899` (Rose) |
| **Couleur secondaire** | `#8b5cf6` (Violet) |
| **Accent** | `#f59e0b` (Orange) |

**Onglet Contact**

| Champ | Valeur |
|-------|--------|
| **Email** | `contact@tenant2.local` |
| **Téléphone** | `+33 1 98 76 54 32` |

**Onglet Options**

| Option | Valeur |
|--------|--------|
| ✅ Wishlist | Activé |
| ❌ Comparaison | Désactivé |
| ✅ Avis clients | Activé |
| ✅ Newsletter | Activé |
| ✅ Mode sombre | Activé |

### 3.3 Sauvegarder

Cliquez sur **Enregistrer**

---

## 🧪 Étape 4 : Tester les Frontends

### 4.1 Tenant 1 - Boutique Sport

**Ouvrir un nouvel onglet** :
```
http://tenant1.local:3000
```

**Vérifications** :
- ✅ Page s'affiche
- ✅ Couleur primaire bleue (`#3b82f6`)
- ✅ Slogan : "Votre équipement sportif de qualité"
- ✅ Contact : contact@tenant1.local

**Console navigateur (F12)** :
```javascript
// Vérifier le tenant chargé
document.cookie
// Devrait contenir: tenant_code=boutiquesport
```

### 4.2 Tenant 2 - Marque Mode

**Ouvrir un nouvel onglet** :
```
http://tenant2.local:3000
```

**Vérifications** :
- ✅ Page s'affiche
- ✅ Couleur primaire rose (`#ec4899`)
- ✅ Slogan : "L'élégance à la française"
- ✅ Contact : contact@tenant2.local

**Console navigateur (F12)** :
```javascript
document.cookie
// Devrait contenir: tenant_code=marquemode
```

---

## 🔍 Débogage

### Le domaine ne résout pas

```bash
# Vérifier /etc/hosts
cat /etc/hosts | grep tenant

# Devrait afficher :
# 127.0.0.1  tenant1.local
# 127.0.0.1  tenant2.local

# Vider le cache DNS (macOS)
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

### Frontend affiche le mauvais tenant

**Vider le cache du navigateur** :
```
Cmd+Shift+R (macOS) ou Ctrl+Shift+R (Windows/Linux)
```

**Vérifier le cookie** :
```javascript
// Console navigateur
document.cookie
// Supprimer manuellement si nécessaire
document.cookie = "tenant_code=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
```

### Erreur 404 "Tenant non trouvé"

**Vérifier dans Odoo** :
```
Quelyos → Tenants / Boutiques → Tous les Tenants
→ Vérifier que le domaine est exactement "tenant1.local" ou "tenant2.local"
→ Vérifier que le tenant est Actif (pas archivé)
```

**Tester l'API directement** :
```bash
curl "http://localhost:8069/api/ecommerce/tenant/by-domain?domain=tenant1.local"
# Devrait retourner {"success": true, "tenant": {...}}
```

---

## 📊 Résumé

| Élément | Tenant 1 (Sport) | Tenant 2 (Mode) |
|---------|------------------|-----------------|
| **Nom** | Boutique Sport | Marque Mode |
| **Code** | boutiquesport | marquemode |
| **Domaine** | tenant1.local | tenant2.local |
| **URL Frontend** | http://tenant1.local:3001 | http://tenant2.local:3001 |
| **URL Backoffice** | http://localhost:5175 (login: admin@tenant1.local) | http://localhost:5175 (login: admin@tenant2.local) |
| **Couleur** | Bleu #3b82f6 | Rose #ec4899 |
| **Plan** | Starter | Pro |
| **Company ID** | 2 (nouvelle) | 3 (nouvelle) |

---

## 🎯 Prochaines Étapes

1. **Ajouter des produits** pour chaque tenant via le backoffice
2. **Personnaliser le branding** (logos, couleurs, réseaux sociaux)
3. **Tester l'isolation** : Les produits de Tenant 1 ne doivent pas apparaître sur Tenant 2
4. **Configurer les moyens de paiement** pour chaque tenant

---

## 📚 Ressources

- **Documentation Odoo Tenants** : odoo-backend/addons/quelyos_api/models/tenant.py
- **Proxy/Middleware Frontend** : vitrine-client/src/proxy.ts
- **API Tenants** : odoo-backend/addons/quelyos_api/controllers/tenant.py
- **Hook Tenant** : vitrine-client/src/lib/tenant/TenantProvider.tsx

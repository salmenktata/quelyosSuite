# Corrections et Workarounds

## Corrections VPS Production - 2026-02-02

### 1. api.quelyos.com redirige vers admin.quelyos.com

**Symptôme** : Accès à `api.quelyos.com` redirige (302) vers `admin.quelyos.com/login`

**Cause** : Le module `quelyos_api/models/ir_http.py` redirige toute requête non-authentifiée sur `/` vers `FRONTEND_LOGIN_URL` (variable d'env du conteneur Odoo = `https://admin.quelyos.com/login`). Les endpoints `/api/*` ne sont pas affectés.

**Fix** : Config Nginx (`/etc/nginx/sites-available/quelyos-api`) :
- Ajout `location = /` retournant un JSON statique `{"service": "Quelyos API", ...}`
- Ajout `location /web` retournant 403 (bloquer accès interface Odoo)
- Retrait des headers CORS de Nginx (délégués à Odoo pour éviter doublons)

**Important** : Ne pas ajouter de headers CORS dans Nginx pour api.quelyos.com — Odoo les gère via `ir_http._post_dispatch`. Des headers doublés causent `Failed to fetch` dans les navigateurs.

### 2. Certificats SSL admin.quelyos.com manquants

**Symptôme** : `nginx -t` échoue avec `cannot load certificate admin.quelyos.com`

**Cause** : Les configs `quelyos-admin` et `quelyos-website` référençaient `/etc/letsencrypt/live/admin.quelyos.com/` qui n'existe pas. Le certificat unique `quelyos.com` couvre tous les sous-domaines (SAN).

**Fix** : Remplacer par `/etc/letsencrypt/live/quelyos.com/fullchain.pem` et `privkey.pem` dans les deux fichiers.

### 3. Login super-admin reste sur /login après connexion

**Symptôme** : Login réussi (API retourne token) mais l'app reste sur `/login`

**Cause** : Race condition — `useAuth()` est un hook local (pas un Context). `Login.tsx` met à jour son state et appelle `navigate('/')`, mais `App.tsx` a sa propre instance de `useAuth()` qui voit encore `isAuthenticated: false` → `<Navigate to="/login" />`.

**Fix** : Dans `super-admin-client/src/App.tsx`, vérifier aussi `tokenService.isAuthenticated()` :
```tsx
const canAccess = import.meta.env.DEV || isAuthenticated || tokenService.isAuthenticated()
```

### 4. PM2 sur le VPS - Structure des services

**Services PM2 (user deploy)** :
| Nom PM2 | Port | CWD |
|---------|------|-----|
| `dashboard` | 5175 | `/home/deploy/quelyos-suite/dashboard-client` |
| `super-admin` | 9000 | `/home/deploy/quelyos-suite/super-admin-client` |
| `shop` | 3001 | Next.js |
| `vitrine` | 3000 | Next.js |

**Redéployer un frontend** :
```bash
# 1. Builder en local
cd super-admin-client && npx vite build

# 2. Copier le dist (supprimer l'ancien d'abord !)
ssh quelyos-vps "rm -rf /home/deploy/quelyos-suite/super-admin-client/dist"
scp -r dist quelyos-vps:/home/deploy/quelyos-suite/super-admin-client/

# 3. Redémarrer via PM2
ssh quelyos-vps "sudo -u deploy pm2 restart super-admin"
```

**⚠️ Ne pas utiliser `kill` directement** — PM2 respawn automatiquement les process.

### 5. Sous-domaines production (référence)

| Service | Sous-domaine | Port |
|---------|-------------|------|
| Site Vitrine | `quelyos.com` / `www.quelyos.com` | 3000 |
| E-commerce | `shop.quelyos.com` | 3001 |
| Dashboard ERP | `backoffice.quelyos.com` | 5175 |
| Super Admin | `admin.quelyos.com` | 9000 |
| Backend API | `api.quelyos.com` | 8069 |

---

## Menu Settings et Apps invisibles dans Odoo 19

### Symptôme
Les menus "Settings" et "Apps" ne sont pas visibles dans la barre de navigation d'Odoo, même pour l'administrateur.

### Cause
Dans Odoo 19, ces menus ont par défaut des séquences très élevées (500 et 550) qui les placent en fin de liste, les rendant invisibles ou difficiles à trouver dans l'interface utilisateur.

### Solution appliquée
1. Ajout des groupes requis à l'utilisateur admin :
   - `Access Rights` (groupe id=2)
   - `Technical Features` (groupe id=7)
   - `Role / Administrator` (groupe id=4)

2. Modification des séquences des menus :
   ```sql
   UPDATE ir_ui_menu SET sequence = 1 WHERE id = 1;  -- Settings
   UPDATE ir_ui_menu SET sequence = 2 WHERE id = 15; -- Apps
   ```

### Script de correction
Un script a été créé pour appliquer cette correction automatiquement :
```bash
./scripts/fix-odoo-menus.sh
```

### Prévention AUTOMATIQUE

Le problème est maintenant corrigé automatiquement à **3 niveaux** :

#### 1. **Module Odoo (quelyos_core)** ✅ Recommandé
Le module `quelyos_core` applique automatiquement les corrections via son `post_init_hook`.
- S'exécute à chaque installation/upgrade du module
- Corrige les séquences des menus (Settings=1, Apps=2)
- Ajoute les groupes requis à l'admin (Access Rights, Technical Features)

```bash
# Pour réappliquer si nécessaire
./scripts/upgrade-odoo.sh quelyos_core
```

#### 2. **Script de démarrage (dev-start.sh)** ✅ Automatique
Le script `dev-start.sh` applique automatiquement les corrections au démarrage du backend.
- S'exécute à chaque `./scripts/dev-start.sh all` ou `./scripts/dev-start.sh backend`
- Idempotent : peut être exécuté plusieurs fois sans problème
- Gère les cas où la DB n'existe pas encore

#### 3. **Script manuel (fix-odoo-menus.sh)**
En dernier recours, un script manuel est disponible :
```bash
./scripts/fix-odoo-menus.sh
docker restart quelyos-odoo
```

### Quand les corrections s'appliquent
- ✅ À chaque démarrage via `dev-start.sh`
- ✅ À chaque installation/upgrade de `quelyos_core`
- ✅ Manuellement via `fix-odoo-menus.sh` si nécessaire

### Date de correction
2026-01-29

### Fichiers modifiés
- `/scripts/dev-start.sh` - Ajout de `fix_odoo_menus()`
- `/scripts/fix-odoo-menus.sh` - Script manuel standalone
- `/odoo-backend/addons/quelyos_core/__init__.py` - Ajout de `_fix_menu_visibility()`

---

# Commande /clean - Nettoyage & Organisation du Projet

## Description
Analyse, nettoie et organise les fichiers du projet en identifiant les éléments inutiles, obsolètes ou mal placés. Cette commande effectue un audit complet avant toute suppression et demande toujours confirmation.

## Usage

```bash
/clean              # Analyse complète du projet (tous services)
/clean --dry-run    # Analyse sans suppression (rapport seulement)
/clean vitrine      # Nettoyer site vitrine (vitrine-quelyos)
/clean ecommerce    # Nettoyer e-commerce (vitrine-client)
/clean backoffice   # Nettoyer backoffice (dashboard-client)
/clean backend      # Nettoyer backend (odoo-backend)
/clean packages     # Nettoyer packages partagés (packages/)
```

**Exemples** :
- `/clean` - Nettoyage complet avec confirmation
- `/clean --dry-run` - Voir ce qui serait nettoyé sans rien supprimer
- `/clean ecommerce` - Nettoyer uniquement le frontend e-commerce

---

## Workflow de la commande

### Étape 1 : Analyse du Projet

**1.1. Inventaire des fichiers par catégorie**

Analyser le projet et catégoriser les fichiers à nettoyer :

#### 🗑️ Fichiers Temporaires & Cache
```bash
# Patterns à détecter
**/*.log
**/*.tmp
**/*.temp
**/*.swp
**/*.swo
**/._*
**/.DS_Store
**/*.bak
**/*.backup
**/*~
**/Thumbs.db
**/.cache/
**/__pycache__/
**/*.pyc
**/*.pyo
**/.pytest_cache/
**/.mypy_cache/
**/node_modules/.cache/
**/.next/cache/
**/.turbo/
**/coverage/
**/.nyc_output/
```

#### 📦 Fichiers de Build Obsolètes
```bash
# Build artifacts à vérifier
vitrine-quelyos/.next/   # Sauf si build récent
vitrine-client/.next/    # Sauf si build récent
vitrine-*/out/           # Export statique
dashboard-client/dist/   # Build production
**/*.map                 # Source maps en dev
**/*.tsbuildinfo         # TypeScript build info
```

#### 📄 Fichiers de Documentation Orphelins
```bash
# Docs non référencées (hors README.md et LOGME.md)
**/*.md                  # Vérifier si orphelin
**/docs/                 # Dossiers docs non utilisés
**/*_old*                # Fichiers renommés "old"
**/*_backup*             # Backups manuels
**/*_copy*               # Copies manuelles
**/*.old                 # Extensions .old
```

#### 🧪 Fichiers de Test Orphelins
```bash
# Tests sans code source correspondant
**/*.test.ts(x)          # Vérifier si source existe
**/*.spec.ts(x)          # Vérifier si source existe
**/__tests__/            # Dossiers tests à auditer
**/e2e/                  # Tests E2E à auditer
```

#### 🎨 Assets Non Utilisés
```bash
# Images/fonts non référencées
**/public/images/        # Vérifier références
**/public/fonts/         # Vérifier références
**/assets/               # Vérifier utilisation
**/*.svg                 # SVG non importés
**/*.png                 # Images non utilisées
**/*.jpg                 # Images non utilisées
```

#### 📁 Dossiers Vides
```bash
# Dossiers sans contenu
find . -type d -empty    # Tous les dossiers vides
```

#### 🔧 Fichiers de Config Dupliqués/Obsolètes
```bash
# Configs à vérifier
**/.env.*.local          # Env locaux multiples
**/*.config.*.bak        # Configs backup
**/tsconfig.*.json       # Configs TS multiples
```

#### 📦 Dépendances Non Utilisées
```bash
# Analyser package.json vs imports réels
npm depcheck             # Frontend
npm depcheck             # Backoffice
pip-autoremove           # Backend Python
```

---

### Étape 2 : Génération du Rapport

**2.1. Format du rapport d'analyse**

```markdown
## 🧹 Rapport de Nettoyage - [Date]

### 📊 Résumé
| Catégorie | Fichiers | Taille | Action |
|-----------|----------|--------|--------|
| Cache/Temporaires | 45 | 128 MB | 🗑️ Supprimer |
| Build obsolètes | 12 | 89 MB | 🗑️ Supprimer |
| Docs orphelins | 3 | 24 KB | ⚠️ Vérifier |
| Tests orphelins | 2 | 8 KB | ⚠️ Vérifier |
| Assets non utilisés | 8 | 2.4 MB | ⚠️ Vérifier |
| Dossiers vides | 5 | 0 B | 🗑️ Supprimer |
| Configs dupliqués | 1 | 4 KB | ⚠️ Vérifier |
| **TOTAL** | **76** | **~220 MB** | |

### 🗑️ Suppression Automatique (Safe)

Ces fichiers peuvent être supprimés en toute sécurité :

#### Cache & Temporaires (45 fichiers, 128 MB)
- `vitrine-client/.next/cache/` - 89 MB
- `vitrine-client/node_modules/.cache/` - 32 MB
- `dashboard-client/node_modules/.cache/` - 7 MB
- `.DS_Store` (12 fichiers)
- `__pycache__/` (8 dossiers)

#### Build Obsolètes (12 fichiers, 89 MB)
- `dashboard-client/dist/` - Non utilisé (build > 7 jours)
- `*.tsbuildinfo` (4 fichiers)
- `*.map` en mode dev (7 fichiers)

#### Dossiers Vides (5 dossiers)
- `vitrine-client/src/components/unused/`
- `dashboard-client/src/utils/deprecated/`
- ...

### ⚠️ Vérification Manuelle Requise

Ces fichiers nécessitent votre validation :

#### Documentation Orpheline (3 fichiers, 24 KB)
| Fichier | Raison | Recommandation |
|---------|--------|----------------|
| `PARITY_ROADMAP_2026-01-25.md` | Non référencé dans README | 🔍 Vérifier utilité |
| `COHERENCE_AUDIT_2026-01-25.md` | Non référencé | 🔍 Vérifier utilité |
| `SECURITY_AUDIT_2026-01-25.md` | Non référencé | 🔍 Vérifier utilité |

#### Tests Orphelins (2 fichiers, 8 KB)
| Fichier | Source manquante | Recommandation |
|---------|------------------|----------------|
| `useOldHook.test.ts` | `useOldHook.ts` supprimé | 🗑️ Supprimer |
| `OldComponent.spec.tsx` | Composant supprimé | 🗑️ Supprimer |

#### Assets Non Référencés (8 fichiers, 2.4 MB)
| Fichier | Références trouvées | Recommandation |
|---------|---------------------|----------------|
| `public/images/old-logo.png` | 0 | 🗑️ Supprimer |
| `public/images/banner-v1.jpg` | 0 | 🔍 Vérifier |
| ...

### 📦 Dépendances Non Utilisées

#### Frontend (npm)
| Package | Dernier import | Recommandation |
|---------|---------------|----------------|
| `lodash` | Aucun | `npm uninstall lodash` |
| `moment` | Aucun (dayjs utilisé) | `npm uninstall moment` |

#### Backoffice (npm)
| Package | Dernier import | Recommandation |
|---------|---------------|----------------|
| `axios` | Aucun (fetch utilisé) | `npm uninstall axios` |

### 🔄 Fichiers Mal Organisés

| Fichier actuel | Emplacement suggéré | Raison |
|----------------|---------------------|--------|
| `src/utils/apiHelper.ts` | `src/lib/api/` | Convention projet |
| `components/Modal.tsx` | `components/common/` | Composant réutilisable |
```

---

### Étape 3 : Confirmation Utilisateur

**3.1. Demander confirmation avec AskUserQuestion**

```typescript
AskUserQuestion({
  questions: [{
    question: "J'ai identifié 76 fichiers (220 MB) à nettoyer. Que souhaitez-vous faire ?",
    header: "Nettoyage",
    multiSelect: false,
    options: [
      {
        label: "Nettoyage complet (Recommandé)",
        description: "Supprimer cache/temp/build + valider fichiers à vérifier"
      },
      {
        label: "Nettoyage sécurisé uniquement",
        description: "Supprimer seulement cache/temp/dossiers vides (sans risque)"
      },
      {
        label: "Rapport uniquement (dry-run)",
        description: "Ne rien supprimer, juste afficher le rapport"
      },
      {
        label: "Nettoyage personnalisé",
        description: "Choisir catégorie par catégorie"
      }
    ]
  }]
})
```

**3.2. Si "Nettoyage personnalisé" sélectionné**

```typescript
AskUserQuestion({
  questions: [{
    question: "Quelles catégories souhaitez-vous nettoyer ?",
    header: "Catégories",
    multiSelect: true,
    options: [
      { label: "Cache & Temporaires", description: "45 fichiers, 128 MB - 100% safe" },
      { label: "Build obsolètes", description: "12 fichiers, 89 MB - Régénérables" },
      { label: "Dossiers vides", description: "5 dossiers - Safe" },
      { label: "Docs orphelins", description: "3 fichiers - À vérifier" }
    ]
  }]
})
```

---

### Étape 4 : Exécution du Nettoyage

**4.1. Ordre d'exécution sécurisé**

1. **Backup préventif** (si fichiers à risque)
   ```bash
   # Créer backup des fichiers à vérifier avant suppression
   mkdir -p .clean-backup-$(date +%Y%m%d)
   ```

2. **Nettoyage cache/temp** (100% safe)
   ```bash
   # Frontend
   rm -rf vitrine-client/.next/cache/
   rm -rf vitrine-client/node_modules/.cache/

   # Backoffice
   rm -rf dashboard-client/node_modules/.cache/
   rm -rf dashboard-client/dist/

   # Python
   find backend -type d -name "__pycache__" -exec rm -rf {} +
   find backend -type f -name "*.pyc" -delete

   # OS files
   find . -name ".DS_Store" -delete
   find . -name "Thumbs.db" -delete
   ```

3. **Suppression dossiers vides**
   ```bash
   find . -type d -empty -delete 2>/dev/null
   ```

4. **Suppression builds obsolètes**
   ```bash
   rm -rf vitrine-client/.next/
   rm -rf dashboard-client/dist/
   find . -name "*.tsbuildinfo" -delete
   ```

5. **Désinstallation dépendances inutilisées**
   ```bash
   cd frontend && npm uninstall <packages>
   cd backoffice && npm uninstall <packages>
   ```

**4.2. Tracking avec TodoWrite**

```markdown
- [x] Analyse du projet
- [x] Génération rapport
- [x] Confirmation utilisateur
- [ ] Nettoyage cache/temp (45 fichiers)
- [ ] Nettoyage builds (12 fichiers)
- [ ] Suppression dossiers vides (5)
- [ ] Vérification intégrité
```

---

### Étape 5 : Vérification Post-Nettoyage

**5.1. Tests d'intégrité**

```bash
# Vérifier que le projet fonctionne toujours

# Frontend
cd frontend && npm run build
cd frontend && npm run lint

# Backoffice
cd backoffice && npm run build
cd backoffice && npm run lint

# Backend
cd odoo-backend && docker-compose exec odoo python -c "print('Odoo OK')"
```

**5.2. Vérification git status**

```bash
# Vérifier les changements
git status

# S'assurer qu'aucun fichier important n'a été supprimé
git diff --stat
```

---

### Étape 6 : Rapport Final

**6.1. Générer rapport de nettoyage**

```markdown
## ✅ Nettoyage Terminé - [Date]

### 📊 Résumé des Actions

| Action | Fichiers | Espace libéré |
|--------|----------|---------------|
| Cache supprimé | 45 | 128 MB |
| Builds nettoyés | 12 | 89 MB |
| Dossiers vides supprimés | 5 | - |
| Dépendances désinstallées | 3 | 15 MB |
| **TOTAL** | **65** | **~232 MB** |

### ✅ Validations
- [x] `npm run build` frontend - ✅ OK
- [x] `npm run build` backoffice - ✅ OK
- [x] `npm run lint` - ✅ OK
- [x] Git status vérifié

### 📁 Fichiers Conservés (décision utilisateur)
- `PARITY_ROADMAP_2026-01-25.md` - Gardé pour référence
- `banner-v1.jpg` - Gardé pour historique

### 💡 Recommandations
1. Ajouter `.clean-backup-*` à `.gitignore`
2. Configurer `npm prune` dans CI/CD
3. Planifier `/clean` mensuel

### 🧹 Prochaine exécution recommandée
Dans 30 jours ou après ajout de nouvelles fonctionnalités majeures.
```

---

## Catégories de Fichiers

### 🟢 Safe (Suppression automatique possible)
- Cache navigateur/build
- `node_modules/.cache/`
- `__pycache__/`
- `.DS_Store`, `Thumbs.db`
- `*.log`, `*.tmp`
- Dossiers vides

### 🟡 Vérification requise
- Fichiers `.md` hors README/LOGME
- Assets non référencés
- Tests orphelins
- Configs dupliquées

### 🔴 Ne jamais supprimer automatiquement
- `node_modules/` (utiliser `npm ci` pour recréer)
- `.env*` (secrets potentiels)
- `package-lock.json` / `pnpm-lock.yaml`
- `.git/`
- Fichiers sources (`.ts`, `.tsx`, `.py`)

---

## Options Avancées

### `--dry-run` - Rapport sans action
```bash
/clean --dry-run
```
Génère uniquement le rapport sans aucune suppression.

### `--force` - Sans confirmation
```bash
/clean --force
```
Exécute le nettoyage safe sans demander confirmation (cache/temp/dossiers vides uniquement).

### `--deps` - Analyse dépendances approfondie
```bash
/clean --deps
```
Analyse détaillée des dépendances npm/pip non utilisées avec suggestions de remplacement.

### `--organize` - Réorganisation des fichiers
```bash
/clean --organize
```
Propose de déplacer les fichiers mal organisés vers leur emplacement correct selon les conventions du projet.

---

## Scripts Utiles

### Commande rapide cache frontend
```bash
rm -rf vitrine-client/.next/cache vitrine-client/node_modules/.cache
```

### Commande rapide cache backoffice
```bash
rm -rf dashboard-client/node_modules/.cache dashboard-client/dist
```

### Commande rapide Python
```bash
find backend -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null
find backend -name "*.pyc" -delete 2>/dev/null
```

### Nettoyage complet (dangereux)
```bash
# ⚠️ Nécessite npm install après
rm -rf vitrine-client/node_modules vitrine-client/.next
rm -rf dashboard-client/node_modules dashboard-client/dist
```

---

## Intégration Git

### Fichiers à ajouter au .gitignore
```gitignore
# Clean command backups
.clean-backup-*/

# Cache
**/.cache/
**/node_modules/.cache/

# Build artifacts
*.tsbuildinfo
*.map

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
```

### Hook pre-commit suggéré
```bash
#!/bin/bash
# Vérifier taille node_modules/.cache
CACHE_SIZE=$(du -sm node_modules/.cache 2>/dev/null | cut -f1)
if [ "$CACHE_SIZE" -gt 100 ]; then
  echo "⚠️ Cache > 100MB. Exécuter /clean recommandé."
fi
```

---

## Règles Importantes

### ✅ À FAIRE
1. **Toujours analyser avant de supprimer**
2. **Demander confirmation** pour fichiers à risque
3. **Vérifier le build** après nettoyage
4. **Conserver un backup** des fichiers douteux
5. **Documenter** les fichiers conservés/supprimés

### ❌ À ÉVITER
1. ❌ Ne jamais supprimer `node_modules/` sans plan de restauration
2. ❌ Ne jamais supprimer `.env*` automatiquement
3. ❌ Ne jamais supprimer `.git/`
4. ❌ Ne jamais supprimer fichiers sources sans vérification
5. ❌ Ne jamais exécuter en production sans dry-run préalable

---

## Fréquence Recommandée

| Contexte | Fréquence | Options |
|----------|-----------|---------|
| Développement quotidien | Hebdomadaire | `/clean --force` |
| Avant commit important | À chaque fois | `/clean --dry-run` |
| Avant release | Obligatoire | `/clean` complet |
| Problèmes de build | Immédiat | `/clean` + rebuild |
| Disque plein | Urgent | `/clean --force` |

---

## Objectif Final

Maintenir un projet **propre et organisé** :
- 🧹 Zéro fichier inutile dans le repo
- 📦 Dépendances minimales et utilisées
- 📁 Structure claire et cohérente
- ⚡ Builds rapides (pas de cache corrompu)
- 💾 Espace disque optimisé

**Un projet propre est un projet maintenable.**

---
title: "Guide Pratique des Commandes Slash"
subtitle: "Quelyos ERP Suite"
author: "Équipe Quelyos"
date: "Janvier 2026"
---

<style>
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
  h1 { color: #0d9488; border-bottom: 3px solid #0d9488; padding-bottom: 10px; }
  h2 { color: #1e40af; margin-top: 30px; }
  h3 { color: #4f46e5; }
  table { width: 100%; border-collapse: collapse; margin: 15px 0; }
  th { background: #0d9488; color: white; padding: 12px; text-align: left; }
  td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
  tr:hover { background: #f0fdfa; }
  code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; color: #dc2626; }
  .category { background: linear-gradient(135deg, #0d9488 0%, #1e40af 100%); color: white; padding: 15px; border-radius: 8px; margin: 20px 0; }
  .tip { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 10px 15px; margin: 15px 0; }
  .warning { background: #fee2e2; border-left: 4px solid #dc2626; padding: 10px 15px; margin: 15px 0; }
</style>

# Guide Pratique des Commandes Slash

## Introduction

Ce guide présente toutes les commandes slash disponibles dans le projet Quelyos ERP Suite. Ces commandes automatisent les tâches courantes de développement, déploiement et maintenance.

**Usage** : Tapez `/nom-commande` dans Claude Code pour exécuter une commande.

---

## 1. Créer une commande slash (personnalisée)

Les commandes slash sont de **simples fichiers Markdown** dans `.claude/commands/`.
Le **nom du fichier** devient le **nom de la commande** :

```
.claude/commands/mon-rapport.md  →  /mon-rapport
```

### Étapes rapides
1. **Créer un fichier** dans `.claude/commands/` (kebab-case recommandé).
2. **Décrire l’objectif** et les cas d’usage.
3. **Définir un workflow clair** en étapes.
4. **Lister les commandes shell** utilisées (si besoin).
5. **Ajouter les messages attendus / erreurs** pour guider l’utilisateur.

### Modèle minimal (copier/coller)
````md
# Commande /nom-commande - Titre court

## Description
Une phrase simple expliquant l’objectif.

## Usage
    /nom-commande
    /nom-commande --option

## Workflow
1. Étape 1…
2. Étape 2…

## Commandes utilisées
    pnpm dev
````

### Bonnes pratiques
- Utiliser **pnpm** (standard du repo).
- Respecter les **ports fixes** : 3000/3001/5175/5176/8069.
- Référencer les **bons dossiers** (`vitrine-*`, `dashboard-client`, `super-admin-client`, `odoo-backend`).
- Éviter les commandes destructives sans confirmation.
- Mettre à jour ce guide si une nouvelle commande est ajoutée.

---

## 2. DevOps - Git & Déploiement

Commandes pour gérer le code source et les déploiements.

| Commande | Description | Usage |
|----------|-------------|-------|
| `/commit` | Créer un commit local avec message conventionnel | `/commit` |
| `/ship` | Commit + push vers GitHub | `/ship` |
| `/deploy` | Checklist déploiement production | `/deploy` |
| `/test` | Lancer la suite de tests complète | `/test` |

### `/commit` - Commit Rapide

Crée un commit local **sans pusher**. Idéal pour préparer plusieurs commits avant un push groupé.

**Workflow** :
1. Analyse les fichiers modifiés
2. Demande le type (feat, fix, chore, refactor)
3. Suggère un message basé sur les changements
4. Crée le commit avec co-author Claude

**Types de commit** :
- `feat:` - Nouvelle fonctionnalité
- `fix:` - Correction de bug
- `chore:` - Maintenance
- `refactor:` - Refactoring sans changement de comportement
- `docs:` - Documentation
- `test:` - Tests
- `perf:` - Performance

### `/ship` - Commit & Push

Comme `/commit` mais avec push automatique vers la branche `main`.

**Différence avec /commit** :
- `/commit` = local uniquement
- `/ship` = local + push remote

---

## 3. Odoo - Serveurs & Modules

Commandes spécifiques à la gestion du backend Odoo.

| Commande | Description | Port |
|----------|-------------|------|
| `/fresh-install` | Réinstallation Odoo 19 (base vierge) | 8069 |
| `/upgrade-odoo` | Upgrader module après modifications | 8069 |
| `/restart-odoo` | Redémarrer serveur Odoo | 8069 |
| `/restart-backoffice` | Redémarrer dashboard React | 5175 |
| `/restart-vitrine` | Redémarrer site vitrine | 3000 |
| `/restart-ecommerce` | Redémarrer e-commerce | 3001 |
| `/restart-all` | Redémarrer tous les services | - |

### `/upgrade-odoo` - Upgrade Module

**OBLIGATOIRE après modification de** :
- Modèles (`models/*.py`)
- Vues (`views/*.xml`)
- Données (`data/*.xml`)
- Sécurité (`security/*.csv`)
- Manifest (`__manifest__.py`)

**Workflow** :
1. Vérifie Docker actif
2. Propose backup DB (optionnel)
3. Exécute upgrade via Docker
4. Redémarre Odoo
5. Vérifie le health check

**Commande exécutée** :
```bash
docker-compose run --rm odoo odoo -d quelyos -u quelyos_api --stop-after-init
```

### `/restart-*` - Redémarrage Services

Redémarre un service spécifique sans toucher aux autres.

**Ports fixes (NE JAMAIS MODIFIER)** :
- Vitrine : 3000
- E-commerce : 3001
- Dashboard : 5175
- Odoo : 8069

---

## 4. Qualité - Audits & Vérifications

Commandes pour assurer la qualité du code et de l'interface.

| Commande | Description | Score |
|----------|-------------|-------|
| `/autofix` | Correction automatique ESLint/Prettier | - |
| `/uiux` | Audit UI/UX complet d'une page | /140 |
| `/coherence` | Audit cohérence tri-couche | /100 |
| `/parity` | Parité Odoo ↔ Quelyos | - |
| `/polish` | Refactoring complet | - |
| `/clean` | Nettoyage fichiers/imports | - |
| `/docs` | Sync documentation | - |
| `/analyze-page` | Analyse page + plan admin | - |

### `/uiux` - Audit UI/UX

Audit complet d'une page dashboard selon la charte UI/UX à 140 points.

**Usage** :
```
/uiux src/pages/finance/budgets/page.tsx
/uiux --fix src/pages/crm/Leads.tsx
/uiux --module finance
```

**Sections évaluées** :
1. Structure de Base (25 pts) - Layout, Breadcrumbs, Header, PageNotice
2. Menus et Navigation (20 pts) - Tabs, Dropdowns, états
3. Composants Standard (25 pts) - SkeletonTable, Button, icônes
4. États et Erreurs (20 pts) - Loading, Error, Empty
5. Dark Mode (15 pts) - Toutes variantes adaptatives
6. Documentation (10 pts) - JSDoc
7. Responsive (5 pts) - Breakpoints
8. Composants Enfants (20 pts bonus)

**Grades** :
- S+ : 140/140
- S : 130-139
- A : 110-129
- B : 90-109
- C : < 90

### `/coherence` - Audit Tri-Couche

Vérifie la cohérence entre les 3 couches :
- Backend Odoo (modèles, API)
- API Controllers (endpoints)
- Frontend React (hooks, pages)

**Vérifie** :
- Champs présents dans les 3 couches
- Types cohérents (string ↔ Char, number ↔ Float)
- Endpoints correspondant aux hooks
- Noms de champs anonymisés

### `/parity` - Parité Fonctionnelle

Compare les fonctionnalités Odoo natives avec l'implémentation Quelyos pour identifier les gaps.

---

## 5. Architecture - Réflexion & Conception

Commandes pour guider les décisions architecturales.

| Commande | Description |
|----------|-------------|
| `/architect` | Analyse & optimisation architecture |
| `/ecommerce` | Audit e-commerce & roadmap |
| `/leverage` | Capitaliser sur existant Odoo |
| `/no-odoo` | Vérifier anonymisation |

### `/leverage` - Capitalisation Odoo

**À UTILISER AVANT TOUTE IMPLÉMENTATION**

Vérifie systématiquement ce qu'Odoo offre nativement pour éviter de réinventer la roue.

**Usage** :
```
/leverage point de vente
/leverage gestion employés
/leverage facturation
```

**Workflow** :
1. Identifie les modules Odoo pertinents
2. Liste les modèles natifs exploitables
3. Génère matrice de décision (natif vs héritage vs custom)
4. Recommande l'approche optimale

**Règle d'Or - TOUJOURS utiliser natif pour** :
- Comptabilité → `account.move`
- Stock → `stock.picking`, `stock.move`
- Produits → `product.product`
- Contacts → `res.partner`
- Utilisateurs → `res.users`

### `/no-odoo` - Anonymisation

Vérifie qu'aucune référence "Odoo" n'est exposée dans les frontends.

**Recherche** :
- Variables : `OdooClient`, `ODOO_URL`
- Messages d'erreur : "Odoo returned..."
- Champs API : `list_price`, `default_code`
- Jargon : `OCA`, `ir.model`, `res.partner`

---

## 6. Sécurité & Performance

Commandes pour auditer sécurité et performance.

| Commande | Description |
|----------|-------------|
| `/security` | Audit sécurité OWASP |
| `/perf` | Analyse performance |
| `/db-sync` | Vérification DB |

### `/security` - Audit Sécurité

Audit multi-niveaux basé sur OWASP :
- Injection SQL/XSS
- Authentification/Sessions
- Permissions/RBAC
- Secrets exposés
- Headers sécurité

### `/perf` - Analyse Performance

- Requêtes N+1
- Bundle size
- Temps de réponse API
- Optimisation images
- Lazy loading

---

## 7. Workflow Recommandé

```
┌─────────────────────────────────────────────────────────────┐
│                    CYCLE DE DÉVELOPPEMENT                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. PLANIFICATION                                            │
│     └── /leverage    Exploiter Odoo natif ?                 │
│                                                              │
│  2. DÉVELOPPEMENT                                            │
│     ├── /restart-*      Relancer services                   │
│     └── /upgrade-odoo   Après modif modèles                 │
│                                                              │
│  3. VÉRIFICATION                                             │
│     ├── /uiux           Audit UI/UX                         │
│     ├── /coherence      Cohérence tri-couche                │
│     ├── /no-odoo        Anonymisation OK                    │
│     └── /test           Tests passent                       │
│                                                              │
│  4. NETTOYAGE                                                │
│     ├── /clean          Fichiers inutiles                   │
│     └── /security       Audit sécurité                      │
│                                                              │
│  5. COMMIT                                                   │
│     ├── /commit         Local uniquement                    │
│     └── /ship           Commit + push                       │
│                                                              │
│  6. DÉPLOIEMENT                                              │
│     └── /deploy         Checklist production                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Référence Rapide

### Par Fréquence d'Usage

| Fréquence | Commandes |
|-----------|-----------|
| Quotidien | `/commit`, `/ship`, `/restart-*`, `/upgrade-odoo` |
| Régulier | `/uiux`, `/leverage`, `/no-odoo`, `/test`, `/autofix` |
| Ponctuel | `/coherence`, `/parity`, `/clean`, `/polish`, `/architect`, `/ecommerce` |
| Rare | `/deploy`, `/security`, `/perf`, `/db-sync`, `/fresh-install` |

### Par Catégorie

| Catégorie | Commandes |
|-----------|-----------|
| **Git** | `/commit`, `/ship` |
| **Serveurs** | `/restart-odoo`, `/restart-backoffice`, `/restart-vitrine`, `/restart-ecommerce`, `/restart-all` |
| **Odoo** | `/fresh-install`, `/upgrade-odoo`, `/leverage`, `/no-odoo`, `/parity` |
| **Qualité** | `/autofix`, `/uiux`, `/coherence`, `/polish`, `/clean`, `/docs`, `/analyze-page` |
| **Architecture** | `/architect`, `/ecommerce` |
| **Sécurité** | `/security`, `/test` |
| **DevOps** | `/deploy`, `/perf`, `/db-sync` |

---

## 9. Bonnes Pratiques

### Avant de coder
- Toujours lancer `/leverage` pour vérifier l'existant Odoo
- Lire le code existant avant de modifier

### Pendant le développement
- `/upgrade-odoo` après chaque modification de modèle
- Incrémenter la version dans `__manifest__.py`

### Avant de commiter
- `/uiux` sur les pages modifiées
- `/no-odoo` pour vérifier l'anonymisation
- `/test` pour valider les tests

### Conventions de commit
```
feat: nouvelle fonctionnalité
fix: correction de bug
chore: maintenance
refactor: refactoring
docs: documentation
test: tests
perf: performance
```

---

## 10. Aide & Support

**Documentation complète** : `.claude/commands/*.md`

**Commandes built-in Claude Code** :
- `/help` - Aide générale
- `/clear` - Effacer conversation
- `/compact` - Résumer conversation

**Contact** : https://quelyos.com

---

*Guide généré automatiquement - Janvier 2026*
*Quelyos ERP Suite v19.0*

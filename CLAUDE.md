# Instructions Claude Code - Quelyos ERP

## Langue
Français pour communications. Code en anglais.

## Architecture
- `frontend/` : Next.js 16 (e-commerce)
- `backoffice/` : React + Vite (admin)
- `backend/addons/quelyos_api/` : Odoo 19 (API)

## Guides détaillés
Voir `.claude/reference/` pour conventions TS/Python, anti-patterns, UX/UI, parité Odoo.

## Workflow Odoo CRITIQUE
**Modification modèle = upgrade obligatoire**
1. Modifier code `models/`
2. Incrémenter version `__manifest__.py`
3. Alerter avec AskUserQuestion
4. Après commit : `/upgrade-odoo`

Alerter AVANT : schéma DB, modèles Odoo, endpoints API

## Commandes disponibles
**DevOps** : `/ship`, `/deploy`, `/test`, `/security`, `/perf`, `/db-sync`
**Odoo** : `/upgrade-odoo`, `/restart-odoo`, `/restart-backoffice`, `/restart-all`
**Qualité** : `/polish`, `/parity`, `/coherence`, `/clean`, `/analyze-page`

## Essentiels
1. Lire README.md et LOGME.md en début de session
2. Lire code avant modification
3. Modifications minimales
4. Alerter avant modif structurelle Odoo
5. Logger sécurisé (`@/lib/logger` au lieu de `console.log`)
6. Tailwind + Zod uniquement

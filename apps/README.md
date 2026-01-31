# Apps - 7 SaaS Spécialisés Quelyos Suite

Ce dossier contient les **7 frontends SaaS spécialisés** partageant le backend unique Odoo 19.

## 📦 Architecture

Chaque SaaS = **frontend dédié** consommant **sous-ensemble de modules** du backend.

## 🎯 Les 7 SaaS

| SaaS | Port | Modules | Cible | Réutilisation |
|------|------|---------|-------|---------------|
| **Finance** | 3010 | finance | TPE/PME, DAF | 85% |
| **Store** | 3011 | store + marketing | E-commerce | 80% |
| **Copilote** | 3012 | stock + GMAO + hr | PME industrie | 40% |
| **Sales** | 3013 | crm + marketing | Commercial | 70% |
| **Retail** | 3014 | pos + store + stock | Retail | 75% |
| **Team** | 3015 | hr | RH | 90% |
| **Support** | 3016 | support + crm | Helpdesk | 65% |

## 🚀 Démarrage

```bash
# Installation
pnpm install

# Lancer un SaaS
pnpm --filter finance-os dev     # Port 3010
./scripts/dev-start.sh finance   # Alternative
```

## 🧩 Packages Partagés

- `@quelyos/ui-kit` - Composants React
- `@quelyos/api-client` - Client API Odoo
- `@quelyos/utils` - Helpers
- `@quelyos/logger` - Logger sécurisé

## 📝 Conventions

**Règle d'or** : ERP Complet (dashboard-client) = source de vérité
- Toujours vérifier si fonctionnalité existe dans ERP Complet
- Réutiliser composants via `@quelyos/ui-kit`
- Respecter dark mode (`dark:` classes)

## 🔗 Ressources

- [Documentation 7 SaaS](../docs/QUELYOS_SUITE_7_SAAS_PLAN.md)
- [Architecture](../ARCHITECTURE.md)
- [Conventions API](../.claude/API_CONVENTIONS.md)

**Version** : 1.0.0-alpha | **Mise à jour** : 2026-01-31

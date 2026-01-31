# Apps - Éditions Quelyos Suite (Template)

Ce dossier est prévu pour contenir les **frontends d'éditions spécialisées** Quelyos Suite. Actuellement, seul un template de référence existe.

## 📦 Architecture Prévue

Chaque édition = **frontend dédié** consommant **sous-ensemble de modules** du backend unique.

## 🏗️ État Actuel

```
apps/
  └── _template/      → Template de référence pour futures éditions
```

**Note** : Les éditions spécialisées ne sont pas encore implémentées. L'ERP complet accessible via `dashboard-client` (port 5175) contient tous les 9 modules.

## 🎯 Système d'Éditions

Le système d'éditions existe dans `dashboard-client/src/config/editions.ts` et permet de configurer quels modules sont accessibles par édition.

**Édition actuelle** : `full` (tous les modules activés)

## 🧩 Packages Partagés

Les packages sont prêts pour être utilisés par de futures éditions :

- `@quelyos/ui-kit` - Composants React
- `@quelyos/api-client` - Client API
- `@quelyos/utils` - Helpers
- `@quelyos/logger` - Logger sécurisé

## 📝 Conventions Futures

**Règle d'or** : ERP Complet (dashboard-client) = source de vérité
- Toujours vérifier si fonctionnalité existe dans ERP Complet
- Réutiliser composants via `@quelyos/ui-kit`
- Respecter dark mode (`dark:` classes)

## 🔗 Ressources

- [Architecture](../ARCHITECTURE.md)
- [Conventions API](../.claude/API_CONVENTIONS.md)
- [Guide Éditions](../dashboard-client/README-EDITIONS.md)

**Version** : 1.0.0 | **Mise à jour** : 2026-01-31

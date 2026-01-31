# Commande /restart-support - Relancer Quelyos Support (Édition)

## Description
Relance le serveur de développement pour l'édition Support du système Quelyos (port 3016).

**Architecture** : Système éditions unifié (dashboard-client avec VITE_EDITION=support)

## Usage
```bash
/restart-support
```

## Workflow de la commande

### Étape 1 : Arrêter le processus existant
1. Identifier le processus qui tourne sur le port 3016
2. Tuer le processus proprement (SIGTERM puis SIGKILL si nécessaire)
3. Vérifier que le port est libéré

### Étape 2 : Relancer le serveur
1. Se placer dans le dossier `dashboard-client/`
2. Exécuter `VITE_EDITION=support pnpm dev` en arrière-plan
3. Attendre que le serveur soit prêt (message "Local: http://localhost:3016/")
4. Confirmer que le serveur est accessible

## Commandes utilisées

```bash
# 1. Trouver et arrêter le processus sur le port 3016
lsof -ti:3016 | xargs kill -9 2>/dev/null || true

# 2. Relancer le serveur
cd dashboard-client && VITE_EDITION=support pnpm dev
```

## Messages de sortie attendus

### Succès
```
✅ Serveur Quelyos Support arrêté (port 3016)
🚀 Redémarrage édition Support...
✅ Édition Support démarrée avec succès sur http://localhost:3016/

📊 Édition active : Support
   - Modules : support + crm
   - Couleur : Violet foncé #9333EA
   - Build time : ~7.13s
```

### Erreur
```
❌ Erreur lors du redémarrage de l'édition Support
💡 Solutions possibles :
- Vérifier que le dossier dashboard-client/ existe
- Vérifier que les dépendances sont installées (pnpm install)
- Vérifier les logs d'erreur ci-dessus
- Vérifier que VITE_EDITION est bien configuré
```

## Notes Techniques
- **Port** : 3016 (configuré dans `vite.config.ts`)
- **Édition** : Support (VITE_EDITION=support)
- **Modules inclus** : support + crm
- **Branding** : Violet foncé #9333EA
- **Architecture** : Système éditions (1 codebase, 8 éditions)
- **Packages partagés** : @quelyos/ui-kit, @quelyos/api-client, @quelyos/auth

## Migration
⚠️ **Ancienne architecture** : `apps/support-os/` (supprimé)  
✅ **Nouvelle architecture** : `dashboard-client/` + `VITE_EDITION=support`

## Voir aussi
- `/restart-all` — Redémarrer tous les services
- `dashboard-client/README-EDITIONS.md` — Guide système éditions
- `docs/EDITIONS_DEV_GUIDE.md` — Documentation développement

## Objectif
Fournir un moyen rapide de relancer l'édition Support du système Quelyos.

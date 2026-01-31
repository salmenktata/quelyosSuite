# Commande /restart-store - Relancer Quelyos Store (Édition)

## Description
Relance le serveur de développement pour l'édition Store du système Quelyos (port 3011).

**Architecture** : Système éditions unifié (dashboard-client avec VITE_EDITION=store)

## Usage
```bash
/restart-store
```

## Workflow de la commande

### Étape 1 : Arrêter le processus existant
1. Identifier le processus qui tourne sur le port 3011
2. Tuer le processus proprement (SIGTERM puis SIGKILL si nécessaire)
3. Vérifier que le port est libéré

### Étape 2 : Relancer le serveur
1. Se placer dans le dossier `dashboard-client/`
2. Exécuter `VITE_EDITION=store pnpm dev` en arrière-plan
3. Attendre que le serveur soit prêt (message "Local: http://localhost:3011/")
4. Confirmer que le serveur est accessible

## Commandes utilisées

```bash
# 1. Trouver et arrêter le processus sur le port 3011
lsof -ti:3011 | xargs kill -9 2>/dev/null || true

# 2. Relancer le serveur
cd dashboard-client && VITE_EDITION=store pnpm dev
```

## Messages de sortie attendus

### Succès
```
✅ Serveur Quelyos Store arrêté (port 3011)
🚀 Redémarrage édition Store...
✅ Édition Store démarrée avec succès sur http://localhost:3011/

📊 Édition active : Store
   - Modules : store + marketing
   - Couleur : Violet #7C3AED
   - Build time : ~7.62s
```

### Erreur
```
❌ Erreur lors du redémarrage de l'édition Store
💡 Solutions possibles :
- Vérifier que le dossier dashboard-client/ existe
- Vérifier que les dépendances sont installées (pnpm install)
- Vérifier les logs d'erreur ci-dessus
- Vérifier que VITE_EDITION est bien configuré
```

## Notes Techniques
- **Port** : 3011 (configuré dans `vite.config.ts`)
- **Édition** : Store (VITE_EDITION=store)
- **Modules inclus** : store + marketing
- **Branding** : Violet #7C3AED
- **Architecture** : Système éditions (1 codebase, 8 éditions)
- **Packages partagés** : @quelyos/ui-kit, @quelyos/api-client, @quelyos/auth

## Migration
⚠️ **Ancienne architecture** : `apps/store-os/` (supprimé)  
✅ **Nouvelle architecture** : `dashboard-client/` + `VITE_EDITION=store`

## Voir aussi
- `/restart-all` — Redémarrer tous les services
- `dashboard-client/README-EDITIONS.md` — Guide système éditions
- `docs/EDITIONS_DEV_GUIDE.md` — Documentation développement

## Objectif
Fournir un moyen rapide de relancer l'édition Store du système Quelyos.

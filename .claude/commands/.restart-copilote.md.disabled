# Commande /restart-copilote - Relancer Quelyos Copilote (Édition)

## Description
Relance le serveur de développement pour l'édition Copilote du système Quelyos (port 3012).

**Architecture** : Système éditions unifié (dashboard-client avec VITE_EDITION=copilote)

## Usage
```bash
/restart-copilote
```

## Workflow de la commande

### Étape 1 : Arrêter le processus existant
1. Identifier le processus qui tourne sur le port 3012
2. Tuer le processus proprement (SIGTERM puis SIGKILL si nécessaire)
3. Vérifier que le port est libéré

### Étape 2 : Relancer le serveur
1. Se placer dans le dossier `dashboard-client/`
2. Exécuter `VITE_EDITION=copilote pnpm dev` en arrière-plan
3. Attendre que le serveur soit prêt (message "Local: http://localhost:3012/")
4. Confirmer que le serveur est accessible

## Commandes utilisées

```bash
# 1. Trouver et arrêter le processus sur le port 3012
lsof -ti:3012 | xargs kill -9 2>/dev/null || true

# 2. Relancer le serveur
cd dashboard-client && VITE_EDITION=copilote pnpm dev
```

## Messages de sortie attendus

### Succès
```
✅ Serveur Quelyos Copilote arrêté (port 3012)
🚀 Redémarrage édition Copilote...
✅ Édition Copilote démarrée avec succès sur http://localhost:3012/

📊 Édition active : Copilote
   - Modules : stock + hr + GMAO
   - Couleur : Orange #EA580C
   - Build time : ~9.25s
```

### Erreur
```
❌ Erreur lors du redémarrage de l'édition Copilote
💡 Solutions possibles :
- Vérifier que le dossier dashboard-client/ existe
- Vérifier que les dépendances sont installées (pnpm install)
- Vérifier les logs d'erreur ci-dessus
- Vérifier que VITE_EDITION est bien configuré
```

## Notes Techniques
- **Port** : 3012 (configuré dans `vite.config.ts`)
- **Édition** : Copilote (VITE_EDITION=copilote)
- **Modules inclus** : stock + hr + GMAO
- **Branding** : Orange #EA580C
- **Architecture** : Système éditions (1 codebase, 8 éditions)
- **Packages partagés** : @quelyos/ui-kit, @quelyos/api-client, @quelyos/auth

## Migration
⚠️ **Ancienne architecture** : `apps/copilote-ops/` (supprimé)  
✅ **Nouvelle architecture** : `dashboard-client/` + `VITE_EDITION=copilote`

## Voir aussi
- `/restart-all` — Redémarrer tous les services
- `dashboard-client/README-EDITIONS.md` — Guide système éditions
- `docs/EDITIONS_DEV_GUIDE.md` — Documentation développement

## Objectif
Fournir un moyen rapide de relancer l'édition Copilote du système Quelyos.

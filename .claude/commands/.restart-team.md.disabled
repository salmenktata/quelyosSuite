# Commande /restart-team - Relancer Quelyos Team (Édition)

## Description
Relance le serveur de développement pour l'édition Team du système Quelyos (port 3015).

**Architecture** : Système éditions unifié (dashboard-client avec VITE_EDITION=team)

## Usage
```bash
/restart-team
```

## Workflow de la commande

### Étape 1 : Arrêter le processus existant
1. Identifier le processus qui tourne sur le port 3015
2. Tuer le processus proprement (SIGTERM puis SIGKILL si nécessaire)
3. Vérifier que le port est libéré

### Étape 2 : Relancer le serveur
1. Se placer dans le dossier `dashboard-client/`
2. Exécuter `VITE_EDITION=team pnpm dev` en arrière-plan
3. Attendre que le serveur soit prêt (message "Local: http://localhost:3015/")
4. Confirmer que le serveur est accessible

## Commandes utilisées

```bash
# 1. Trouver et arrêter le processus sur le port 3015
lsof -ti:3015 | xargs kill -9 2>/dev/null || true

# 2. Relancer le serveur
cd dashboard-client && VITE_EDITION=team pnpm dev
```

## Messages de sortie attendus

### Succès
```
✅ Serveur Quelyos Team arrêté (port 3015)
🚀 Redémarrage édition Team...
✅ Édition Team démarrée avec succès sur http://localhost:3015/

📊 Édition active : Team
   - Modules : hr
   - Couleur : Cyan #0891B2
   - Build time : ~7.72s
```

### Erreur
```
❌ Erreur lors du redémarrage de l'édition Team
💡 Solutions possibles :
- Vérifier que le dossier dashboard-client/ existe
- Vérifier que les dépendances sont installées (pnpm install)
- Vérifier les logs d'erreur ci-dessus
- Vérifier que VITE_EDITION est bien configuré
```

## Notes Techniques
- **Port** : 3015 (configuré dans `vite.config.ts`)
- **Édition** : Team (VITE_EDITION=team)
- **Modules inclus** : hr
- **Branding** : Cyan #0891B2
- **Architecture** : Système éditions (1 codebase, 8 éditions)
- **Packages partagés** : @quelyos/ui-kit, @quelyos/api-client, @quelyos/auth

## Migration
⚠️ **Ancienne architecture** : `apps/team-os/` (supprimé)  
✅ **Nouvelle architecture** : `dashboard-client/` + `VITE_EDITION=team`

## Voir aussi
- `/restart-all` — Redémarrer tous les services
- `dashboard-client/README-EDITIONS.md` — Guide système éditions
- `docs/EDITIONS_DEV_GUIDE.md` — Documentation développement

## Objectif
Fournir un moyen rapide de relancer l'édition Team du système Quelyos.

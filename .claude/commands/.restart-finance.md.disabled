# Commande /restart-finance - Relancer Quelyos Finance (Édition)

## Description
Relance le serveur de développement pour l'édition Finance du système Quelyos (port 3010).

**Architecture** : Système éditions unifié (dashboard-client avec VITE_EDITION=finance)

## Usage
```bash
/restart-finance
```

## Workflow de la commande

### Étape 1 : Arrêter le processus existant
1. Identifier le processus qui tourne sur le port 3010
2. Tuer le processus proprement (SIGTERM puis SIGKILL si nécessaire)
3. Vérifier que le port est libéré

### Étape 2 : Relancer le serveur
1. Se placer dans le dossier `dashboard-client/`
2. Exécuter `VITE_EDITION=finance pnpm dev` en arrière-plan
3. Attendre que le serveur soit prêt (message "Local: http://localhost:3010/")
4. Confirmer que le serveur est accessible

## Commandes utilisées

```bash
# 1. Trouver et arrêter le processus sur le port 3010
lsof -ti:3010 | xargs kill -9 2>/dev/null || true

# 2. Relancer le serveur
cd dashboard-client && VITE_EDITION=finance pnpm dev
```

## Messages de sortie attendus

### Succès
```
✅ Serveur Quelyos Finance arrêté (port 3010)
🚀 Redémarrage édition Finance...
✅ Édition Finance démarrée avec succès sur http://localhost:3010/

📊 Édition active : Finance
   - Modules : finance
   - Couleur : Vert #059669
   - Build time : ~7.18s
```

### Erreur
```
❌ Erreur lors du redémarrage de l'édition Finance
💡 Solutions possibles :
- Vérifier que le dossier dashboard-client/ existe
- Vérifier que les dépendances sont installées (pnpm install)
- Vérifier les logs d'erreur ci-dessus
- Vérifier que VITE_EDITION est bien configuré
```

## Notes Techniques
- **Port** : 3010 (configuré dans `vite.config.ts`)
- **Édition** : Finance (VITE_EDITION=finance)
- **Modules inclus** : finance
- **Branding** : Vert #059669
- **Architecture** : Système éditions (1 codebase, 8 éditions)
- **Packages partagés** : @quelyos/ui-kit, @quelyos/api-client, @quelyos/auth

## Migration
⚠️ **Ancienne architecture** : `apps/finance-os/` (supprimé)  
✅ **Nouvelle architecture** : `dashboard-client/` + `VITE_EDITION=finance`

## Voir aussi
- `/restart-all` — Redémarrer tous les services
- `dashboard-client/README-EDITIONS.md` — Guide système éditions
- `docs/EDITIONS_DEV_GUIDE.md` — Documentation développement

## Objectif
Fournir un moyen rapide de relancer l'édition Finance du système Quelyos.

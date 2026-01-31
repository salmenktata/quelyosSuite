# Commande /restart-retail - Relancer Quelyos Retail (Édition)

## Description
Relance le serveur de développement pour l'édition Retail du système Quelyos (port 3014).

**Architecture** : Système éditions unifié (dashboard-client avec VITE_EDITION=retail)

## Usage
```bash
/restart-retail
```

## Workflow de la commande

### Étape 1 : Arrêter le processus existant
1. Identifier le processus qui tourne sur le port 3014
2. Tuer le processus proprement (SIGTERM puis SIGKILL si nécessaire)
3. Vérifier que le port est libéré

### Étape 2 : Relancer le serveur
1. Se placer dans le dossier `dashboard-client/`
2. Exécuter `VITE_EDITION=retail pnpm dev` en arrière-plan
3. Attendre que le serveur soit prêt (message "Local: http://localhost:3014/")
4. Confirmer que le serveur est accessible

## Commandes utilisées

```bash
# 1. Trouver et arrêter le processus sur le port 3014
lsof -ti:3014 | xargs kill -9 2>/dev/null || true

# 2. Relancer le serveur
cd dashboard-client && VITE_EDITION=retail pnpm dev
```

## Messages de sortie attendus

### Succès
```
✅ Serveur Quelyos Retail arrêté (port 3014)
🚀 Redémarrage édition Retail...
✅ Édition Retail démarrée avec succès sur http://localhost:3014/

📊 Édition active : Retail
   - Modules : pos + store + stock
   - Couleur : Rouge #DC2626
   - Build time : ~7.80s
```

### Erreur
```
❌ Erreur lors du redémarrage de l'édition Retail
💡 Solutions possibles :
- Vérifier que le dossier dashboard-client/ existe
- Vérifier que les dépendances sont installées (pnpm install)
- Vérifier les logs d'erreur ci-dessus
- Vérifier que VITE_EDITION est bien configuré
```

## Notes Techniques
- **Port** : 3014 (configuré dans `vite.config.ts`)
- **Édition** : Retail (VITE_EDITION=retail)
- **Modules inclus** : pos + store + stock
- **Branding** : Rouge #DC2626
- **Architecture** : Système éditions (1 codebase, 8 éditions)
- **Packages partagés** : @quelyos/ui-kit, @quelyos/api-client, @quelyos/auth

## Migration
⚠️ **Ancienne architecture** : `apps/retail-os/` (supprimé)  
✅ **Nouvelle architecture** : `dashboard-client/` + `VITE_EDITION=retail`

## Voir aussi
- `/restart-all` — Redémarrer tous les services
- `dashboard-client/README-EDITIONS.md` — Guide système éditions
- `docs/EDITIONS_DEV_GUIDE.md` — Documentation développement

## Objectif
Fournir un moyen rapide de relancer l'édition Retail du système Quelyos.

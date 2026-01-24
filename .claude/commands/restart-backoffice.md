# Commande /restart-backoffice - Relancer le serveur Backoffice

## Description
Relance le serveur de développement Vite pour le backoffice (port 5175).

## Usage

```bash
/restart-backoffice
```

## Workflow de la commande

### Étape 1 : Arrêter le processus existant
1. Identifier le processus qui tourne sur le port 5175
2. Tuer le processus proprement (SIGTERM puis SIGKILL si nécessaire)
3. Vérifier que le port est libéré

### Étape 2 : Relancer le serveur
1. Se placer dans le dossier `backoffice/`
2. Exécuter `npm run dev` en arrière-plan
3. Attendre que le serveur soit prêt (message "Local: http://localhost:5175/")
4. Confirmer que le serveur est accessible

## Commandes utilisées

```bash
# 1. Trouver et arrêter le processus sur le port 5175
lsof -ti:5175 | xargs kill -9 2>/dev/null || true

# 2. Relancer le serveur
cd backoffice && npm run dev
```

## Messages de sortie attendus

### Succès
```
✅ Serveur backoffice arrêté (port 5175)
🚀 Redémarrage du serveur backoffice...

  VITE v5.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5175/
  ➜  Network: use --host to expose

✅ Serveur backoffice démarré avec succès sur http://localhost:5175/
```

### Erreur
```
❌ Erreur lors du redémarrage du serveur backoffice
Détails : [message d'erreur]

💡 Solutions possibles :
- Vérifier que npm est installé
- Vérifier que les dépendances sont installées (npm install)
- Vérifier les logs d'erreur ci-dessus
```

## Règles Importantes

### ✅ À FAIRE
1. **Toujours vérifier** que le port 5175 est bien libéré avant de relancer
2. **Afficher les logs** en temps réel pour que l'utilisateur voie le démarrage
3. **Confirmer le succès** avec l'URL du serveur
4. **Gérer les erreurs** et proposer des solutions

### ❌ À ÉVITER
1. ❌ Ne jamais laisser plusieurs processus sur le même port
2. ❌ Ne jamais masquer les erreurs de compilation
3. ❌ Ne jamais relancer si le dossier backoffice n'existe pas

## Notes Techniques

- **Port par défaut** : 5175 (configuré dans `vite.config.ts`)
- **Processus** : Node.js exécutant Vite
- **Délai démarrage** : ~2-5 secondes selon la taille du projet
- **Hot Module Replacement** : Activé automatiquement

## Cas d'usage typiques

1. **Après modification de vite.config.ts** : Redémarrage nécessaire
2. **Après installation de dépendances** : Redémarrage recommandé
3. **En cas de freeze/lag** : Redémarrage pour nettoyer le cache
4. **Port déjà utilisé** : Libérer et relancer

---

## Objectif

Fournir un moyen rapide et fiable de redémarrer le serveur de développement backoffice sans avoir à quitter Claude Code ou chercher le processus manuellement.

**Gain de temps : 30-60 secondes par redémarrage.**

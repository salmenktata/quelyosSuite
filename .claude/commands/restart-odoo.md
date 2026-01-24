# Commande /restart-odoo - Relancer le serveur Odoo

## Description
Relance le serveur Odoo (backend) sur le port 8069 via Docker Compose.

## Usage

```bash
/restart-odoo
```

## Workflow de la commande

### Étape 1 : Arrêter les conteneurs Odoo
1. Se placer dans le dossier `backend/`
2. Arrêter les conteneurs Docker avec `docker-compose down`
3. Vérifier que les conteneurs sont bien arrêtés

### Étape 2 : Relancer les conteneurs
1. Démarrer les conteneurs avec `docker-compose up -d`
2. Attendre que Odoo soit prêt (vérifier les logs)
3. Confirmer que le serveur est accessible sur http://localhost:8069/

## Commandes utilisées

```bash
# 1. Arrêter les conteneurs
cd backend && docker-compose down

# 2. Relancer les conteneurs
cd backend && docker-compose up -d

# 3. Vérifier les logs
docker-compose logs -f --tail=50
```

## Messages de sortie attendus

### Succès
```
🛑 Arrêt des conteneurs Odoo...
✅ Conteneurs arrêtés

🚀 Redémarrage des conteneurs Odoo...
✅ Conteneurs démarrés

📋 Vérification de l'état...
✅ Serveur Odoo démarré avec succès sur http://localhost:8069/

💡 Utilisez `docker-compose logs -f` pour voir les logs en temps réel
```

### Erreur
```
❌ Erreur lors du redémarrage d'Odoo
Détails : [message d'erreur]

💡 Solutions possibles :
- Vérifier que Docker est démarré
- Vérifier le fichier docker-compose.yml
- Vérifier les logs : docker-compose logs
- Libérer le port 8069 si occupé
```

## Règles Importantes

### ✅ À FAIRE
1. **Toujours utiliser docker-compose** (pas docker run direct)
2. **Attendre que Odoo soit prêt** avant de confirmer (peut prendre 10-30s)
3. **Afficher les logs** pour détecter les erreurs de démarrage
4. **Vérifier l'état des conteneurs** avec `docker-compose ps`

### ❌ À ÉVITER
1. ❌ Ne jamais utiliser `docker-compose down -v` (supprime les volumes = perte données)
2. ❌ Ne jamais forcer l'arrêt sans `docker-compose down` propre
3. ❌ Ne jamais redémarrer si le dossier backend n'existe pas
4. ❌ Ne jamais ignorer les erreurs de migration de base de données

## Notes Techniques

- **Port par défaut** : 8069 (Odoo HTTP)
- **Base de données** : PostgreSQL sur port 5432
- **Conteneurs** : `quelyos-odoo`, `quelyos-db`
- **Délai démarrage** : ~10-30 secondes selon état DB
- **Données persistantes** : Volumes Docker (préservés)

## Cas d'usage typiques

1. **Après modification du code backend** : Redémarrage pour appliquer les changements
2. **Après ajout/modification de modules Odoo** : Redémarrage nécessaire
3. **En cas d'erreur 500** : Redémarrage pour réinitialiser l'état
4. **Après modification docker-compose.yml** : Redémarrage obligatoire
5. **Base de données bloquée** : Redémarrage pour libérer les connexions

## Commandes associées

```bash
# Voir les logs en temps réel
docker-compose logs -f

# Vérifier l'état des conteneurs
docker-compose ps

# Accéder au shell Odoo
docker exec -it quelyos-odoo bash

# Reset complet (DANGER : perte données)
cd backend && ./reset.sh
```

---

## Objectif

Fournir un moyen rapide et fiable de redémarrer le serveur Odoo sans avoir à manipuler Docker manuellement.

**Gain de temps : 30-60 secondes par redémarrage.**

# Commande /restart-all - Relancer Tous les Services

## Description
Relance l'intégralité des services du projet Quelyos ERP : Backend Odoo (8069), Backoffice (5175) et Frontend (3000).

## Usage

```bash
/restart-all
```

## Workflow de la commande

### Étape 1 : Arrêter tous les services existants
1. Arrêter le serveur Frontend (port 3000)
2. Arrêter le serveur Backoffice (port 5175)
3. Arrêter les conteneurs Docker Odoo (port 8069)
4. Vérifier que tous les ports sont libérés

### Étape 2 : Relancer Backend Odoo
1. Se placer dans `backend/`
2. Démarrer les conteneurs Docker avec `docker-compose up -d`
3. Attendre que Odoo soit prêt (~10-30s)
4. Confirmer que l'API est accessible sur http://localhost:8069/

### Étape 3 : Relancer Backoffice
1. Se placer dans `backoffice/`
2. Démarrer le serveur Vite en arrière-plan
3. Attendre que Vite soit prêt (~2-5s)
4. Confirmer que le backoffice est accessible sur http://localhost:5175/

### Étape 4 : Relancer Frontend
1. Se placer dans `frontend/`
2. Démarrer le serveur Next.js en arrière-plan
3. Attendre que Next.js soit prêt (~5-10s)
4. Confirmer que le frontend est accessible sur http://localhost:3000/

## Commandes utilisées

```bash
# 1. Arrêter tous les processus
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:5175 | xargs kill -9 2>/dev/null || true
cd backend && docker-compose down

# 2. Relancer Backend Odoo
cd backend && docker-compose up -d

# 3. Relancer Backoffice (en arrière-plan)
cd backoffice && npm run dev &

# 4. Relancer Frontend (en arrière-plan)
cd frontend && npm run dev &
```

## Messages de sortie attendus

### Succès
```
🛑 Arrêt de tous les services...
   ✅ Frontend arrêté (port 3000)
   ✅ Backoffice arrêté (port 5175)
   ✅ Backend Odoo arrêté (conteneurs Docker)

🚀 Redémarrage du Backend Odoo...
   ✅ Conteneurs démarrés
   ✅ Odoo prêt sur http://localhost:8069/

🚀 Redémarrage du Backoffice...
   ✅ Serveur Vite démarré sur http://localhost:5175/

🚀 Redémarrage du Frontend...
   ✅ Serveur Next.js démarré sur http://localhost:3000/

✅ Tous les services sont opérationnels !

📋 Services actifs :
   • Frontend    : http://localhost:3000
   • Backoffice  : http://localhost:5175
   • API Odoo    : http://localhost:8069/api/ecommerce/*
   • Interface   : http://localhost:8069 (admin/admin)
```

### Erreur
```
❌ Erreur lors du redémarrage des services
Service en erreur : [nom du service]
Détails : [message d'erreur]

💡 Solutions possibles :
- Vérifier que Docker est démarré (pour Odoo)
- Vérifier que npm est installé (pour Frontend/Backoffice)
- Vérifier que les dépendances sont installées (npm install)
- Vérifier les ports 3000, 5175 et 8069
- Consulter les logs individuels de chaque service
```

## Règles Importantes

### ✅ À FAIRE
1. **Respecter l'ordre de démarrage** : Backend → Backoffice → Frontend (les frontends dépendent de l'API)
2. **Attendre que chaque service soit prêt** avant de passer au suivant
3. **Afficher l'état de chaque service** pour débogage
4. **Vérifier les ports** sont bien libérés avant de relancer
5. **Confirmer le succès global** avec tous les URLs

### ❌ À ÉVITER
1. ❌ Ne jamais utiliser `docker-compose down -v` (perte de données)
2. ❌ Ne jamais lancer les services en parallèle sans attendre Odoo
3. ❌ Ne jamais ignorer les erreurs d'un service avant de lancer le suivant
4. ❌ Ne jamais masquer les logs d'erreur

## Notes Techniques

### Ports et Services
- **Frontend** : http://localhost:3000 (Next.js)
- **Backoffice** : http://localhost:5175 (Vite)
- **Backend** : http://localhost:8069 (Odoo via Docker)

### Temps de démarrage
- **Odoo** : ~10-30 secondes (migration DB possible)
- **Backoffice** : ~2-5 secondes
- **Frontend** : ~5-10 secondes
- **Total** : ~20-45 secondes

### Processus et Conteneurs
- **Odoo** : Conteneurs Docker `quelyos-odoo`, `quelyos-db`
- **Backoffice** : Processus Node.js (Vite)
- **Frontend** : Processus Node.js (Next.js)

## Cas d'usage typiques

1. **Après modification des variables d'environnement** : Redémarrage complet nécessaire
2. **Après modification docker-compose.yml** : Redémarrage obligatoire
3. **Après installation de dépendances globales** : Redémarrage recommandé
4. **En cas d'erreurs réseau/API** : Redémarrage pour réinitialiser l'état
5. **Après un git pull majeur** : Redémarrage pour appliquer tous les changements
6. **Avant de commencer une session de travail** : S'assurer que tout est en ordre

## Commandes associées

### Vérification de l'état
```bash
# Vérifier tous les ports actifs
lsof -i:3000,5175,8069

# Vérifier les conteneurs Docker
docker-compose ps

# Vérifier les processus Node.js
ps aux | grep node
```

### Redémarrages individuels
```bash
/restart-odoo       # Backend uniquement
/restart-backoffice # Backoffice uniquement
```

### Logs
```bash
# Logs Odoo
docker-compose logs -f

# Logs Frontend/Backoffice
# (affichés dans les terminaux de démarrage)
```

## Avantages

✅ **Gain de temps** : 2-3 minutes économisées vs redémarrage manuel
✅ **Fiabilité** : Ordre de démarrage garanti
✅ **Visibilité** : État clair de chaque service
✅ **Simplicité** : Une seule commande pour tout relancer

---

## Objectif

Fournir un moyen rapide et fiable de redémarrer l'ensemble de la stack Quelyos ERP en une seule commande, tout en gérant correctement les dépendances entre services.

**Gain de temps : 2-3 minutes par redémarrage complet.**

# Commande /restart-all - Relancer Tous les Services

## Description
Relance l'intégralité des services du projet Quelyos Suite : Backend Odoo (8069), ERP Complet (5175), Site Vitrine (3000), E-commerce (3001), Super Admin (9000), et les 7 Éditions spécialisées (3010-3016) via VITE_EDITION.

**Alternative recommandée** : Utiliser `./scripts/dev-start.sh all` pour un contrôle plus granulaire.

## Usage

```bash
/restart-all
```

## Workflow de la commande

### Étape 1 : Arrêter tous les services existants
1. Arrêter le Site Vitrine (port 3000)
2. Arrêter le E-commerce (port 3001)
3. Arrêter le ERP Complet (port 5175)
4. Arrêter le Super Admin (port 9000)
5. Arrêter les 7 SaaS si actifs (ports 3010-3016)
6. Arrêter les conteneurs Docker Odoo (port 8069)
7. Vérifier que tous les ports sont libérés

### Étape 2 : Relancer Backend Odoo
1. Se placer dans `odoo-odoo-backend/`
2. Démarrer les conteneurs Docker avec `docker-compose up -d`
3. Attendre que Odoo soit prêt (~10-30s)
4. Confirmer que l'API est accessible sur http://localhost:8069/

### Étape 3 : Relancer Backoffice
1. Se placer dans `dashboard-client/`
2. Démarrer le serveur Vite en arrière-plan
3. Attendre que Vite soit prêt (~2-5s)
4. Confirmer que le backoffice est accessible sur http://localhost:5175/

### Étape 4 : Relancer Site Vitrine
1. Nettoyer le cache `.next` (évite les erreurs de cache corrompu)
2. Se placer dans `vitrine-quelyos/`
3. Démarrer le serveur Next.js en arrière-plan
3. Attendre que Next.js soit prêt (~5-10s)
4. Confirmer que le site vitrine est accessible sur http://localhost:3000/

### Étape 5 : Relancer E-commerce
1. Nettoyer le cache `.next` (évite les erreurs de cache corrompu)
2. Se placer dans `vitrine-client/`
3. Démarrer le serveur Next.js en arrière-plan
3. Attendre que Next.js soit prêt (~5-10s)
4. Confirmer que l'e-commerce est accessible sur http://localhost:3001/

## Commandes utilisées

```bash
# Alternative : Utiliser le script automatisé
./scripts/dev-stop.sh all
./scripts/dev-start.sh all

# Ou manuellement :
# 1. Arrêter tous les processus (existants + SaaS)
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:5175 | xargs kill -9 2>/dev/null || true
lsof -ti:9000 | xargs kill -9 2>/dev/null || true
# SaaS (si actifs)
for port in 3010 3011 3012 3013 3014 3015 3016; do
  lsof -ti:$port | xargs kill -9 2>/dev/null || true
done
cd odoo-backend && docker-compose down

# 2. Relancer Backend Odoo
cd odoo-backend && docker-compose up -d

# 3. Relancer ERP Complet (Full Suite)
cd dashboard-client && pnpm dev &

# 4. Nettoyer cache + Relancer Site Vitrine
rm -rf vitrine-quelyos/.next
cd vitrine-quelyos && pnpm dev &

# 5. Nettoyer cache + Relancer E-commerce
rm -rf vitrine-client/.next
cd vitrine-client && pnpm dev &

# 6. Relancer Super Admin
cd super-admin-client && pnpm dev &

# 7. Relancer les 7 Éditions (système éditions unifié)
for edition in finance team sales store copilote retail support; do
  port=$(case $edition in
    finance) echo 3010;;
    store) echo 3011;;
    copilote) echo 3012;;
    sales) echo 3013;;
    retail) echo 3014;;
    team) echo 3015;;
    support) echo 3016;;
  esac)
  VITE_EDITION=$edition pnpm --filter dashboard-client dev --port $port &
done
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
   • Site Vitrine  : http://localhost:3000 (marketing)
   • E-commerce    : http://localhost:3001 (boutique en ligne)
   • ERP Complet   : http://localhost:5175 (Full Suite)
   • Super Admin   : http://localhost:9000 (admin SaaS)
   • API Backend   : http://localhost:8069/api/*

📋 SaaS actifs :
   • Quelyos Finance    : http://localhost:3010
   • Quelyos Store      : http://localhost:3011
   • Quelyos Copilote  : http://localhost:3012
   • Quelyos Sales      : http://localhost:3013
   • Quelyos Retail     : http://localhost:3014
   • Quelyos Team       : http://localhost:3015
   • Quelyos Support    : http://localhost:3016
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

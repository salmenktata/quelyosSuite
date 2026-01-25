# Configuration Redis pour Quelyos ERP

## Vue d'ensemble

Redis est utilisé pour le rate limiting distribué et le cache partagé entre les workers Odoo.

## Installation

### 1. Démarrer Redis avec Docker Compose

Redis est déjà configuré dans `docker-compose.yml`. Pour le démarrer :

```bash
cd backend
docker-compose up -d redis
```

Vérifier que Redis fonctionne :

```bash
docker-compose exec redis redis-cli ping
# Doit retourner: PONG
```

### 2. Installer la dépendance Python redis-py

Le package `redis` doit être installé dans le container Odoo :

```bash
# Option 1 : Installation manuelle dans le container
docker-compose exec odoo pip3 install redis>=5.0.0

# Option 2 : Rebuild de l'image avec requirements.txt
# (nécessite un Dockerfile personnalisé)
```

**Note** : Les dépendances sont définies dans `addons/quelyos_api/requirements.txt`

### 3. Redémarrer Odoo

```bash
docker-compose restart odoo
```

### 4. Vérifier les logs

```bash
docker logs quelyos-odoo --tail 50 | grep -i redis
```

Vous devriez voir :
```
INFO ... Redis connected successfully at redis:6379
```

## Configuration

### Variables d'environnement

Les variables suivantes sont configurées dans `docker-compose.yml` :

- `REDIS_HOST` : Nom du service Redis (défaut: `redis`)
- `REDIS_PORT` : Port Redis (défaut: `6379`)

### Paramètres Redis

Le service Redis est configuré avec :
- **Mémoire max** : 256 MB
- **Politique d'éviction** : `allkeys-lru` (éviction LRU sur toutes les clés)
- **TTL par défaut pour rate limiting** : 60 secondes

## Utilisation dans le code

### Rate Limiting (view count)

Le rate limiting des vues produits utilise automatiquement Redis :

```python
# Dans controllers/main.py
if self._check_view_count_rate_limit(product.id):
    # Incrémenter le compteur de vues
    ...
```

La clé Redis générée : `view_count:{IP}:{product_id}` avec TTL de 60s

### Fallback

Si Redis n'est pas disponible :
- Le système bascule automatiquement sur un cache en mémoire (dictionnaire Python)
- Un warning est logué : `"Could not connect to Redis. Falling back to in-memory cache"`
- ⚠️ Le cache mémoire n'est pas partagé entre workers Odoo

## Monitoring

### Vérifier l'état de Redis

```bash
# Connexion au CLI Redis
docker-compose exec redis redis-cli

# Commandes utiles
> INFO stats          # Statistiques
> DBSIZE             # Nombre de clés
> KEYS view_count:*  # Voir les clés de rate limiting (dev uniquement!)
> TTL <key>          # Temps restant avant expiration
```

### Métriques importantes

```bash
# Mémoire utilisée
docker-compose exec redis redis-cli INFO memory | grep used_memory_human

# Nombre de connexions
docker-compose exec redis redis-cli INFO clients

# Hit rate du cache
docker-compose exec redis redis-cli INFO stats | grep keyspace
```

## Troubleshooting

### Erreur : "Could not connect to Redis"

1. Vérifier que Redis est démarré :
   ```bash
   docker-compose ps redis
   ```

2. Vérifier les logs Redis :
   ```bash
   docker logs quelyos-redis
   ```

3. Tester la connexion réseau :
   ```bash
   docker-compose exec odoo ping redis
   ```

### Erreur : "redis module not found"

Installer le package Python :
```bash
docker-compose exec odoo pip3 install redis>=5.0.0
docker-compose restart odoo
```

### Performance dégradée

1. Vérifier la mémoire disponible :
   ```bash
   docker stats quelyos-redis
   ```

2. Si la limite de 256MB est atteinte, augmenter dans `docker-compose.yml` :
   ```yaml
   command: redis-server --maxmemory 512mb --maxmemory-policy allkeys-lru
   ```

3. Redémarrer Redis :
   ```bash
   docker-compose restart redis
   ```

## Production

### Recommandations

1. **Persistence** : Activer RDB snapshots pour la persistance des données
   ```yaml
   command: redis-server --save 60 1000 --maxmemory 512mb
   volumes:
     - redis_data:/data
   ```

2. **Sécurité** : Ajouter un mot de passe Redis
   ```yaml
   command: redis-server --requirepass ${REDIS_PASSWORD}
   environment:
     REDIS_PASSWORD: ${REDIS_PASSWORD}
   ```

3. **Monitoring** : Utiliser Redis Exporter pour Prometheus/Grafana

4. **Haute disponibilité** : Configurer Redis Sentinel ou Redis Cluster

## Désactivation

Pour revenir au cache mémoire (non-recommandé en production) :

1. Arrêter Redis :
   ```bash
   docker-compose stop redis
   ```

2. Le système basculera automatiquement sur le cache mémoire avec un warning dans les logs

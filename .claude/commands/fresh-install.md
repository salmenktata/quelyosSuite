# Commande /fresh-install - Installation Fraîche Odoo 19

Réinitialise complètement Odoo 19 avec une base de données vierge et réinstalle tous les modules Quelyos.

## Usage

```bash
/fresh-install                    # Reset complet + installation
/fresh-install --verify           # Reset + installation + vérifications approfondies
/fresh-install --no-oca          # Reset sans modules OCA (Quelyos uniquement)
```

## Quand utiliser ?

- **Test d'installation propre** : Valider l'installation sur une base vierge
- **Corruption de base** : Repartir de zéro après problème DB
- **Avant déploiement** : Tester le processus d'installation complet
- **Debug modules** : Isoler un problème d'installation
- **Développement** : Réinitialiser les données de test

## Instructions pour Claude

Quand l'utilisateur exécute `/fresh-install`, effectue :

### 1. Arrêt et Nettoyage

```bash
cd odoo-backend

# Arrêter tous les conteneurs
docker-compose down -v

# Supprimer les volumes (base de données)
docker volume rm odoo-backend_postgres_data odoo-backend_odoo_data odoo-backend_odoo_config 2>/dev/null || true

# Supprimer les conteneurs orphelins
docker rm -f quelyos-db quelyos-odoo quelyos-redis 2>/dev/null || true
```

**Informer l'utilisateur** :
```
🧹 Nettoyage de l'environnement Odoo...
   ✓ Conteneurs arrêtés
   ✓ Volumes supprimés (base de données effacée)
   ✓ Conteneurs orphelins supprimés
```

### 2. Démarrage avec Base Vierge

```bash
# Démarrer PostgreSQL et Redis
docker-compose up -d db redis

# Attendre que PostgreSQL soit prêt
sleep 10

# Démarrer Odoo
docker-compose up -d odoo

# Attendre le démarrage complet
sleep 20
```

**Suivre les logs en temps réel** :
```bash
docker-compose logs -f odoo
```

**Attendre de voir** : `HTTP service (werkzeug) running on`

### 3. Installation Modules Quelyos

```bash
# Installer quelyos_api (inclut toutes les dépendances)
docker-compose exec -T odoo odoo-bin \
  -d quelyos_fresh \
  -i quelyos_api \
  --db_host=db \
  --db_user=odoo \
  --db_password=odoo \
  --stop-after-init \
  --log-level=info

# Redémarrer Odoo
docker-compose restart odoo
sleep 5
```

**Informer l'utilisateur** :
```
📦 Installation des modules Quelyos...
   ✓ quelyos_api installé
   ✓ 14 modules Odoo Community installés
   ✓ Odoo redémarré
```

### 4. Vérifications Post-Installation

#### A. Modules installés

```bash
docker exec quelyos-db psql -U odoo -d quelyos_fresh -c "
SELECT name, state, latest_version
FROM ir_module_module
WHERE name LIKE 'quelyos%' OR name IN (
  'sale_management', 'stock', 'website', 'website_sale',
  'product', 'account', 'crm', 'delivery', 'payment'
)
ORDER BY name;
"
```

**Vérifier** :
- ✅ `quelyos_api` : state = `installed`
- ✅ 14 modules Odoo : state = `installed`

#### B. Endpoints API disponibles

```bash
# Test santé API
curl -s http://localhost:8069/api/health

# Test endpoint produits (doit retourner JSON)
curl -s http://localhost:8069/api/ecommerce/products | jq '.' || echo "❌ API non disponible"
```

#### C. Données démo créées

```bash
docker exec quelyos-db psql -U odoo -d quelyos_fresh -c "
SELECT
  (SELECT COUNT(*) FROM quelyos_tenant) as tenants,
  (SELECT COUNT(*) FROM quelyos_subscription) as subscriptions,
  (SELECT COUNT(*) FROM quelyos_subscription_plan) as plans;
"
```

**Attendu** :
- `tenants` : 3+ (admin + demo)
- `subscriptions` : 1+
- `plans` : 3 (Starter, Pro, Enterprise)

#### D. Isolation OCA (pas de modules tiers)

```bash
docker exec quelyos-db psql -U odoo -d quelyos_fresh -c "
SELECT name, state
FROM ir_module_module
WHERE state = 'installed'
  AND name NOT IN (
    'base', 'mail', 'sale_management', 'stock', 'website',
    'website_sale', 'product', 'account', 'crm', 'delivery',
    'payment', 'web', 'web_editor', 'portal', 'auth_signup',
    'payment_stripe', 'payment_paypal', 'sale_stock', 'website_payment'
  )
  AND name NOT LIKE 'quelyos%'
ORDER BY name;
"
```

**Attendu** : Aucun module OCA/tiers (sauf si --no-oca non utilisé)

### 5. Rapport Final

Générer un rapport formaté :

```markdown
✅ Installation Fraîche Odoo 19 - Succès

🐳 Services
   ✓ PostgreSQL : running (port 5432)
   ✓ Redis       : running (port 6379)
   ✓ Odoo 19     : running (port 8069)

📦 Modules Installés
   ✓ quelyos_api (v19.0.1.1.0)
   ✓ 14 modules Odoo Community standard
   ✓ 0 modules tiers/OCA

🌐 Endpoints API
   ✓ http://localhost:8069/api/health
   ✓ http://localhost:8069/api/ecommerce/*

🔐 Accès Odoo
   URL  : http://localhost:8069
   User : admin
   Pass : admin

📊 Données Démo
   ✓ 3 tenants créés
   ✓ 3 plans d'abonnement
   ✓ 1+ souscriptions actives

⏱️  Temps total : 45 secondes
```

### 6. Flag --verify (Vérifications Approfondies)

Si flag `--verify`, ajouter :

#### Vérifier la configuration Odoo

```bash
docker-compose exec odoo cat /etc/odoo/odoo.conf | grep -E 'addons_path|db_name|db_host'
```

#### Tester l'authentification API

```bash
curl -X POST http://localhost:8069/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"login": "admin", "password": "admin"}' \
  | jq '.'
```

#### Vérifier les webhooks configurés

```bash
docker exec quelyos-db psql -U odoo -d quelyos_fresh -c "
SELECT name, event, url FROM quelyos_webhook WHERE active = true;
"
```

#### Lancer healthcheck complet

```bash
./scripts/check-odoo-health.sh
```

### 7. Gestion des Erreurs

#### Erreur : Port 8069 déjà utilisé

```bash
lsof -ti:8069 | xargs kill -9
docker-compose restart odoo
```

#### Erreur : PostgreSQL n'est pas prêt

```bash
docker-compose logs db
docker-compose restart db
sleep 15
```

#### Erreur : Module installation failed

```bash
# Voir les logs détaillés
docker-compose logs odoo | grep -A 10 -i error

# Vérifier la syntaxe Python
docker-compose exec odoo python -m py_compile /mnt/extra-addons/quelyos_api/__init__.py
docker-compose exec odoo python -m py_compile /mnt/extra-addons/quelyos_api/__manifest__.py
```

#### Erreur : Base de données corrompue

```bash
# Supprimer manuellement la base
docker exec quelyos-db psql -U odoo -d postgres -c "DROP DATABASE IF EXISTS quelyos_fresh;"

# Relancer l'installation
docker-compose restart odoo
```

## Cas d'Usage

### Développement quotidien

```bash
# Reset rapide pour tester une migration
/fresh-install
```

### Avant une démo client

```bash
# Installation propre + vérifications complètes
/fresh-install --verify
```

### Debug problème d'installation

```bash
# Installation sans OCA pour isoler le problème
/fresh-install --no-oca
```

### CI/CD Pipeline

```bash
# Automatisé dans les tests d'intégration
/fresh-install --verify
# Puis lancer les tests E2E
```

## Notes Importantes

- ⚠️  **DÉTRUIT TOUTES LES DONNÉES** : Sauvegardez avant si nécessaire
- ⏱️  **Durée** : ~45-60 secondes (selon machine)
- 🔒 **Isolation** : Uniquement modules Odoo Community (pas de dépendances OCA/tiers)
- 📝 **Logs** : Tous les logs disponibles avec `docker-compose logs -f odoo`
- 🔄 **Idempotent** : Peut être relancé plusieurs fois sans problème

## Commandes Complémentaires

Après `/fresh-install`, vous pouvez :

- `/restart-odoo` : Redémarrer uniquement Odoo
- `/upgrade-odoo` : Mettre à jour quelyos_api
- `/db-sync` : Vérifier la synchronisation DB
- `/coherence` : Audit fonctionnel tri-couche

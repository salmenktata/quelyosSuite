# Guide de Développement Backend Odoo - Quelyos ERP

## 🔄 Workflow de Développement Odoo

### Principe Fondamental
**TOUTE modification d'un modèle Odoo nécessite une mise à jour (upgrade) du module pour synchroniser la base de données.**

---

## 📝 Checklist Modification de Modèle

Quand vous modifiez un fichier dans `backend/addons/quelyos_api/models/` :

### 1. Modification du Code
- [ ] Ajouter/modifier le champ dans le modèle Python
- [ ] Vérifier que le champ a des attributs appropriés (`string`, `help`, `default`, etc.)
- [ ] Vérifier la cohérence avec les conventions Odoo

### 2. Incrémenter la Version du Module
Éditer `backend/addons/quelyos_api/__manifest__.py` :
```python
{
    'name': 'Quelyos API',
    'version': '19.0.1.0.1',  # Incrémenter le dernier chiffre
    ...
}
```

### 3. Upgrade du Module
**OBLIGATOIRE après modification de modèle** :
```bash
cd backend
docker-compose exec odoo odoo -d quelyos -u quelyos_api --stop-after-init
docker-compose restart odoo
```

### 4. Vérifier la Création de la Colonne
```bash
docker exec quelyos-db psql -U odoo -d quelyos -c "\d product_template" | grep nom_du_champ
```

### 5. Tester l'API
```bash
# Tester que l'endpoint fonctionne sans erreur
curl -X POST http://localhost:8069/api/ecommerce/products \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"call","params":{"limit":1},"id":1}'
```

---

## 🚨 Types de Changements Nécessitant un Upgrade

### ✅ Upgrade OBLIGATOIRE
- Ajout/modification/suppression de champ dans un modèle (`fields.*`)
- Modification de `__manifest__.py` (dépendances, data files)
- Ajout/modification de fichiers XML dans `data/`
- Ajout/modification de fichiers CSV dans `security/`
- Changement de contraintes SQL (`_sql_constraints`)
- Modification de méthodes `@api.constrains` ou `@api.depends`

### ⚠️ Upgrade RECOMMANDÉ
- Modification de la logique métier dans les méthodes
- Ajout de nouveaux endpoints API dans `controllers/`
- Modification de computed fields

### ℹ️ Pas d'upgrade nécessaire
- Modification de logs (`_logger.info`)
- Modification de messages d'erreur (strings statiques)
- Refactoring sans changement de signature

---

## 🔧 Scripts de Développement

### Script d'upgrade rapide
Créer `backend/upgrade.sh` :
```bash
#!/bin/bash
set -e

MODULE=${1:-quelyos_api}

echo "🔄 Upgrading module: $MODULE"
docker-compose exec odoo odoo -d quelyos -u $MODULE --stop-after-init

echo "♻️  Restarting Odoo..."
docker-compose restart odoo

echo "✅ Done! Waiting for Odoo to be ready..."
sleep 5

echo "🧪 Testing API health..."
curl -s http://localhost:8069/web/health | grep -q "pass" && echo "✅ Odoo is healthy" || echo "⚠️  Odoo health check failed"
```

Usage :
```bash
chmod +x backend/upgrade.sh
./backend/upgrade.sh quelyos_api
```

### Script de vérification des champs
Créer `backend/check_fields.sh` :
```bash
#!/bin/bash
# Vérifie que tous les champs du modèle existent en DB

MODEL_FILE=$1
TABLE_NAME=$2

if [ -z "$MODEL_FILE" ] || [ -z "$TABLE_NAME" ]; then
    echo "Usage: $0 <model_file.py> <table_name>"
    exit 1
fi

echo "🔍 Extracting fields from $MODEL_FILE..."
FIELDS=$(grep -oP '^\s+\w+\s*=\s*fields\.\w+' "$MODEL_FILE" | awk '{print $1}' | sort)

echo "🔍 Checking database table $TABLE_NAME..."
for field in $FIELDS; do
    EXISTS=$(docker exec quelyos-db psql -U odoo -d quelyos -t -c "SELECT column_name FROM information_schema.columns WHERE table_name = '$TABLE_NAME' AND column_name = '$field';" | xargs)
    if [ -z "$EXISTS" ]; then
        echo "❌ MISSING: $field"
    else
        echo "✅ OK: $field"
    fi
done
```

Usage :
```bash
./backend/check_fields.sh backend/addons/quelyos_api/models/stock_quant.py product_template
```

---

## 🧪 Tests Automatisés

### Test de Parité Modèle ↔ DB
Créer `backend/tests/test_model_db_parity.py` :
```python
# -*- coding: utf-8 -*-
from odoo.tests import TransactionCase
import logging

_logger = logging.getLogger(__name__)

class TestModelDatabaseParity(TransactionCase):
    """Vérifie que tous les champs des modèles existent en DB"""

    def test_product_template_fields_exist(self):
        """Tous les champs de ProductTemplate doivent exister en DB"""
        ProductTemplate = self.env['product.template']

        # Récupérer tous les champs du modèle
        fields = ProductTemplate._fields

        # Tenter de lire un produit avec tous les champs
        product = ProductTemplate.search([], limit=1)
        if not product:
            self.skipTest("No products in database")

        # Essayer de lire tous les champs (provoquera erreur si colonne manquante)
        try:
            product.read(list(fields.keys()))
        except Exception as e:
            self.fail(f"Field access failed: {e}")
```

Lancer les tests :
```bash
docker-compose exec odoo odoo -d quelyos --test-enable --stop-after-init -u quelyos_api
```

---

## 📊 Migrations Odoo (Avancé)

Pour les changements complexes, utiliser le système de migrations Odoo.

### Structure
```
backend/addons/quelyos_api/
└── migrations/
    └── 19.0.1.0.1/
        ├── pre-migrate.py
        └── post-migrate.py
```

### Exemple : Migration pour ajouter low_stock_threshold
`migrations/19.0.1.0.1/pre-migrate.py` :
```python
# -*- coding: utf-8 -*-
import logging

_logger = logging.getLogger(__name__)

def migrate(cr, version):
    """Migration pre-upgrade : préparer la DB"""
    _logger.info('Running pre-migration for version 19.0.1.0.1')

    # Vérifier si la colonne existe déjà
    cr.execute("""
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'product_template'
        AND column_name = 'low_stock_threshold'
    """)

    if not cr.fetchone():
        _logger.info('Adding column low_stock_threshold to product_template')
        cr.execute("""
            ALTER TABLE product_template
            ADD COLUMN low_stock_threshold double precision DEFAULT 10.0
        """)
```

`migrations/19.0.1.0.1/post-migrate.py` :
```python
# -*- coding: utf-8 -*-
import logging

_logger = logging.getLogger(__name__)

def migrate(cr, version):
    """Migration post-upgrade : peupler les données"""
    _logger.info('Running post-migration for version 19.0.1.0.1')

    # Exemple : initialiser les seuils selon la catégorie
    cr.execute("""
        UPDATE product_template
        SET low_stock_threshold = 20.0
        WHERE categ_id IN (
            SELECT id FROM product_category WHERE name ILIKE '%high rotation%'
        )
    """)
```

---

## 🔄 Workflow Git Recommandé

### Avant chaque commit
```bash
# 1. Vérifier si des modèles ont été modifiés
git diff --name-only | grep "models/"

# 2. Si OUI → Vérifier que la version a été incrémentée
git diff backend/addons/quelyos_api/__manifest__.py | grep version

# 3. Upgrader le module localement
./backend/upgrade.sh quelyos_api

# 4. Tester l'API
curl -X POST http://localhost:8069/api/ecommerce/products \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"call","params":{"limit":1},"id":1}'

# 5. Commiter
git add .
git commit -m "feat: add low_stock_threshold field to ProductTemplate

- Add low_stock_threshold field (default: 10.0)
- Increment module version to 19.0.1.0.1
- Tested: API endpoints working correctly"
```

---

## 🚀 Déploiement en Production

### Checklist Pré-déploiement
- [ ] Version incrémentée dans `__manifest__.py`
- [ ] Tests locaux passent
- [ ] Migration script créé si changement DB complexe
- [ ] Documentation mise à jour (README.md, LOGME.md)

### Commande de Déploiement
```bash
# En production, toujours upgrader les modules modifiés
docker-compose exec odoo odoo -d quelyos -u quelyos_api --stop-after-init
docker-compose restart odoo

# Vérifier les logs
docker logs quelyos-odoo --tail 100 | grep -i "error\|exception\|traceback"
```

---

## 📚 Ressources

- [Odoo Development Documentation](https://www.odoo.com/documentation/19.0/developer.html)
- [Odoo ORM Documentation](https://www.odoo.com/documentation/19.0/developer/reference/backend/orm.html)
- [Odoo Migration Guide](https://www.odoo.com/documentation/19.0/developer/howtos/upgrade_custom_db.html)

---

## ⚠️ Erreurs Courantes à Éviter

### ❌ Ne JAMAIS faire
```python
# Ajouter un champ puis redémarrer Odoo sans upgrade
low_stock_threshold = fields.Float(...)
# ❌ docker-compose restart odoo  # ERREUR : colonne n'existera pas !
```

### ✅ Toujours faire
```python
# Ajouter un champ, incrémenter version, puis upgrader
low_stock_threshold = fields.Float(...)
# ✅ docker-compose exec odoo odoo -d quelyos -u quelyos_api --stop-after-init
# ✅ docker-compose restart odoo
```

---

**Dernière mise à jour** : 2026-01-24

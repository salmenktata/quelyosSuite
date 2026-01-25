# Tests de Parité Backend Odoo ↔ API REST

## 🎯 Objectif

Ces tests vérifient que l'API REST `/api/ecommerce/*` retourne **exactement** les mêmes données que celles stockées dans la base de données Odoo.

## 📋 Prérequis

1. **Odoo en cours d'exécution** :
   ```bash
   cd backend
   docker-compose up -d
   ```

2. **Python 3.10+ avec pytest** :
   ```bash
   pip install pytest requests
   ```

3. **Module quelyos_api installé** dans Odoo

## 🚀 Lancer les tests

### Tous les tests
```bash
cd backend
pytest tests/ -v
```

### Tests spécifiques
```bash
# Tests produits uniquement
pytest tests/test_parity_products.py -v

# Tests clients uniquement
pytest tests/test_parity_customers.py -v

# Test spécifique
pytest tests/test_parity_products.py::TestProductsParity::test_api_products_list_matches_odoo_db -v
```

### Avec rapport détaillé
```bash
pytest tests/ -v --tb=short --maxfail=5
```

## 📊 Tests implémentés

### `test_parity_products.py`
- ✅ Liste produits API === DB Odoo (IDs, noms, prix)
- ✅ Détail produit API === DB Odoo (tous champs)
- ✅ Création produit via API écrit dans DB Odoo
- ✅ Stock API === stock.quant Odoo

### `test_parity_customers.py`
- ✅ Liste clients API === res.partner Odoo
- ✅ Détail client API === res.partner Odoo
- ✅ Nombre commandes API === sale.order count Odoo
- ✅ Export CSV inclut tous les clients Odoo

## 🔧 Configuration

Modifier `conftest.py` pour changer :
- URL Odoo : `ODOO_URL = "http://localhost:8069"`
- Base de données : `ODOO_DB = "quelyos"`
- Credentials : `ODOO_USERNAME`, `ODOO_PASSWORD`

## 📝 Ajouter de nouveaux tests

1. Créer un fichier `test_parity_<module>.py`
2. Utiliser les fixtures disponibles :
   - `odoo_connection` : Accès direct DB via XML-RPC
   - `api_session` : Session HTTP authentifiée pour API REST
   - `create_test_product` : Créer produit de test (auto-cleanup)
   - `create_test_customer` : Créer client de test (auto-cleanup)

3. Structure type :
```python
def test_api_xxx_matches_odoo_yyy(odoo_connection, api_session):
    # 1. Récupérer depuis Odoo DB
    odoo_data = odoo_connection['models'].execute_kw(...)

    # 2. Récupérer depuis API REST
    api_response = api_session.post(...)

    # 3. Comparer et asserter
    assert odoo_data == api_data
```

## ⚠️ Important

- **Ne jamais** modifier les données de production dans les tests
- Utiliser les fixtures `create_test_*` qui nettoient automatiquement
- Les tests s'exécutent en **séquentiel** (workers=1) pour éviter conflits DB
- Timeout : 30s par test max

## 📈 Résultats attendus

```
======================== test session starts =========================
collected 8 items

test_parity_products.py::TestProductsParity::test_api_products_list_matches_odoo_db PASSED
test_parity_products.py::TestProductsParity::test_api_product_detail_matches_odoo_db PASSED
test_parity_products.py::TestProductsParity::test_api_product_create_writes_to_odoo_db PASSED
test_parity_products.py::TestProductsParity::test_api_product_stock_matches_odoo_quants PASSED
test_parity_customers.py::TestCustomersParity::test_api_customers_list_matches_odoo_partners PASSED
test_parity_customers.py::TestCustomersParity::test_api_customer_detail_matches_odoo_partner PASSED
test_parity_customers.py::TestCustomersParity::test_api_customer_orders_count_matches_sale_orders PASSED
test_parity_customers.py::TestCustomersParity::test_api_export_customers_includes_all_odoo_customers PASSED

======================== 8 passed in 12.34s =========================
```

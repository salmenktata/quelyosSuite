# Quelyos Subscription - Module Odoo

Module de gestion des abonnements SaaS pour Quelyos ERP.

## Fonctionnalités

### Plans d'abonnement
- Gestion de plans tarifaires (Starter, Pro, Enterprise)
- Configuration des limites (utilisateurs, produits, commandes)
- Tarification mensuelle et annuelle
- Features personnalisables par plan
- Intégration Stripe Subscriptions

### Abonnements
- Création d'abonnements avec période d'essai (14 jours)
- Gestion du cycle de vie (trial, active, past_due, cancelled, expired)
- Suivi de l'utilisation en temps réel (quotas)
- Webhooks Stripe pour synchronisation automatique

### Système de quotas
- Vérification automatique avant création de ressources
- Alertes email à 80% des limites
- Blocage à 100% avec message d'upgrade
- Applicable aux users, produits et commandes

### API REST
- 7 endpoints JSON-RPC :
  - `GET /api/ecommerce/subscription/plans` - Liste des plans (public)
  - `GET /api/ecommerce/subscription/current` - Abonnement actuel (auth)
  - `POST /api/ecommerce/subscription/create` - Créer abonnement (auth)
  - `POST /api/ecommerce/subscription/upgrade` - Upgrade plan (auth)
  - `POST /api/ecommerce/subscription/cancel` - Annuler abonnement (auth)
  - `POST /api/ecommerce/subscription/check-quota` - Vérifier quota (auth)
  - `GET /api/ecommerce/subscription/admin/list` - Liste tous abonnements (admin)

## Installation

### 1. Copier le module

```bash
cp -r quelyos_subscription /path/to/odoo/addons/
```

### 2. Mettre à jour la liste des modules

```bash
cd /path/to/odoo
./odoo-bin -u quelyos_subscription -d your_database
```

### 3. Installer le module

Via l'interface Odoo : Apps → Rechercher "Quelyos Subscription" → Installer

### 4. Configurer Stripe (optionnel)

1. Créer un compte Stripe (https://stripe.com)
2. Créer les produits et prix dans Stripe Dashboard
3. Copier les Price IDs dans les plans Odoo
4. Configurer le webhook secret dans Paramètres Système

## Configuration

### Plans initiaux

3 plans sont créés automatiquement à l'installation :

| Plan | Prix/mois | Users | Produits | Commandes/an |
|------|-----------|-------|----------|--------------|
| **Starter** | 29€ | 1 | 1 000 | 5 000 |
| **Pro** | 79€ | 5 | 10 000 | 50 000 |
| **Enterprise** | Sur devis | ∞ | ∞ | ∞ |

### Cron Jobs

Deux tâches planifiées sont configurées :

- **Check Trial Expiry** (quotidien à 1h) : Expire les essais gratuits
- **Check Quota Warnings** (quotidien à 2h) : Envoie alertes à 80% des quotas

## Usage

### Frontend/Backoffice

Appeler les endpoints API via JSON-RPC :

```javascript
// Récupérer les plans disponibles
const response = await fetch('/api/ecommerce/subscription/plans', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'call',
    params: {},
    id: 1
  })
});

const data = await response.json();
console.log(data.result); // { success: true, data: [...] }
```

### Backend Odoo

Vérifier les quotas dans vos modèles :

```python
from odoo.exceptions import UserError

class YourModel(models.Model):
    _inherit = 'your.model'

    @api.model_create_multi
    def create(self, vals_list):
        # Vérifier quota avant création
        try:
            self.env['subscription.quota.mixin'].check_subscription_quota('products')
        except UserError as e:
            raise e

        return super().create(vals_list)
```

## Dépendances

- `base` - Odoo Core
- `sale` - Gestion des ventes
- `product` - Gestion des produits
- `account` - Comptabilité
- `mail` - Messagerie et suivi

## Auteur

Quelyos - https://quelyos.com

## Licence

LGPL-3 (cf. LICENSE file)

## Support

- Documentation : https://docs.quelyos.com
- Email : support@quelyos.com
- GitHub Issues : https://github.com/quelyos/quelyos-erp/issues

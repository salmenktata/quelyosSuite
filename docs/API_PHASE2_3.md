# Documentation API - Nouvelles Routes Phase 2 & 3

**Version Backend** : 19.0.1.36.0  
**Date** : 2026-01-30  
**23 nouvelles routes documentées**

---

## 📋 Récapitulatif

| Module | Fonctionnalité | Routes | Modèles |
|--------|----------------|--------|---------|
| Stock | Réservations Manuelles | 6 | quelyos.stock.reservation |
| Stock | Late Availability Filter | 3 | sale.order (champs computed) |
| Marketing | Link Tracker | 4 | quelyos.link.tracker, quelyos.link.tracker.click |
| Marketing | A/B Testing | 6 | quelyos.marketing.campaign.variant |
| Marketing | Analytics Graphiques | 4 | - (analytics routes) |

---

## 1. Stock - Réservations Manuelles

Bloque des quantités pour événements/commandes spéciales.

### Routes

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/stock/reservations` | Liste avec filtres |
| POST | `/api/stock/reservations/<id>` | Détails |
| POST | `/api/stock/reservations/create` | Créer (draft) |
| POST | `/api/stock/reservations/<id>/activate` | Activer |
| POST | `/api/stock/reservations/<id>/release` | Libérer |
| POST | `/api/stock/reservations/<id>/delete` | Supprimer |

### Exemple: Créer Réservation

```bash
curl -X POST "$ODOO_URL/api/stock/reservations/create" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "params": {
      "product_id": 123,
      "reserved_qty": 50,
      "location_id": 8,
      "reason": "event",
      "expiration_date": "2026-02-15T23:59:59"
    }
  }'
```

---

## 2. Stock - Late Availability Filter

Filtrage commandes par disponibilité future du stock.

### Routes

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/orders/fulfillment-status` | Liste par priorité |
| POST | `/api/orders/<id>/fulfillment-detail` | Analyse ligne par ligne |
| POST | `/api/orders/fulfillment-stats` | KPIs globaux |

### Priorités

- `immediate`: Stock complet (0j)
- `short`: < 7 jours
- `medium`: 7-30 jours
- `long`: > 30 jours
- `backorder`: Aucune date

### Exemple: Commandes Urgentes

```bash
curl -X POST "$ODOO_URL/api/orders/fulfillment-status" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "jsonrpc": "2.0",
    "params": {
      "priority": "short",
      "limit": 20
    }
  }'
```

---

## 3. Marketing - Link Tracker

Tracking individuel des clics sur liens emails.

### Routes

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/marketing/campaigns/<id>/links` | Liste liens campagne |
| POST | `/api/marketing/links/<id>` | Détails lien |
| POST | `/api/marketing/links/<id>/stats` | Analytics (pays/jour) |
| GET | `/r/<token>` | **Redirection publique** (302) |

### Exemple: Stats d'un Lien

```bash
curl -X POST "$ODOO_URL/api/marketing/links/12/stats" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"jsonrpc": "2.0", "params": {}}'
```

**Response**:
```json
{
  "success": true,
  "stats": {
    "total_clicks": 145,
    "unique_clicks": 98,
    "by_country": [
      {"country": "FR", "clicks": 85},
      {"country": "BE", "clicks": 32}
    ],
    "by_day": [...]
  }
}
```

---

## 4. Marketing - A/B Testing

Test 3 variantes (A/B/C) et sélection gagnante.

### Routes

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/marketing/campaigns/<id>/variants` | Liste variantes |
| POST | `/api/marketing/campaigns/<id>/variants/create` | Créer (A/B/C) |
| POST | `/api/marketing/campaigns/variants/<id>` | Détails |
| POST | `/api/marketing/campaigns/variants/<id>/select-winner` | Marquer gagnante |
| POST | `/api/marketing/campaigns/variants/<id>/update` | Modifier |
| POST | `/api/marketing/campaigns/variants/<id>/delete` | Supprimer |

### Score de Conversion

```
conversion_score = (open_rate × 0.4) + (click_rate × 0.4) + ((100 - bounce_rate) × 0.2)
```

### Exemple: Créer Variante B

```bash
curl -X POST "$ODOO_URL/api/marketing/campaigns/5/variants/create" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "jsonrpc": "2.0",
    "params": {
      "variant_letter": "B",
      "subject": "Soldes Hiver : -50% !",
      "body": "<html>...</html>"
    }
  }'
```

---

## 5. Marketing - Analytics Graphiques

Données Chart.js pour visualisations.

### Routes

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/marketing/campaigns/<id>/analytics/timeline` | Line chart (7j) |
| POST | `/api/marketing/campaigns/<id>/analytics/funnel` | Bar chart (conversion) |
| POST | `/api/marketing/campaigns/<id>/analytics/devices` | Pie chart (devices) |
| POST | `/api/marketing/campaigns/<id>/analytics/heatmap` | Clics par lien |

### Exemple: Timeline

```bash
curl -X POST "$ODOO_URL/api/marketing/campaigns/5/analytics/timeline" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"jsonrpc": "2.0", "params": {}}'
```

**Response** (Chart.js ready):
```json
{
  "chart_data": {
    "labels": ["2026-01-24", "2026-01-25", ...],
    "datasets": [{
      "label": "Ouverts",
      "data": [60, 85, 92, ...],
      "borderColor": "rgb(59, 130, 246)"
    }]
  }
}
```

---

## 🔑 Authentification

**Header requis** :
```
Authorization: Bearer <token>
```

**Obtention token** :
```bash
curl -X POST "$ODOO_URL/api/auth/login" \
  -d '{
    "jsonrpc": "2.0",
    "params": {
      "email": "admin@example.com",
      "password": "password"
    }
  }' | jq -r '.result.access_token'
```

---

## 📊 Format Réponse Standard

**Succès** :
```json
{
  "jsonrpc": "2.0",
  "result": {
    "success": true,
    "data": {...}
  }
}
```

**Erreur** :
```json
{
  "jsonrpc": "2.0",
  "result": {
    "success": false,
    "error": "Message d'erreur"
  }
}
```

---

## 🧪 Testing

### Variables Environnement

```bash
export ODOO_URL="http://localhost:8069"
export AUTH_TOKEN="<votre_token>"
```

### Health Check

```bash
curl "$ODOO_URL/web/health"
# {"status": "pass"}
```

---

## 📚 Ressources

- **Code Source** : `odoo-backend/addons/quelyos_api/`
- **Controllers** : `controllers/inventory_ctrl.py`, `controllers/marketing_campaigns.py`
- **Models** : `models/stock_reservation.py`, `models/marketing_campaign_variant.py`
- **Postman Collection** : À créer avec exemples ci-dessus

---

**Version** : 1.0.0  
**Dernière mise à jour** : 2026-01-30  
**Mainteneur** : Quelyos Team

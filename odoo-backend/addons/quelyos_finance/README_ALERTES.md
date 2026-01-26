# Alertes de Trésorerie - Quelyos Finance

## 📋 Description

Système d'alertes automatiques pour surveiller la trésorerie et prévenir les problèmes de liquidité.

## ✨ Fonctionnalités

### Types d'alertes

| Type | Description | Déclenchement |
|------|-------------|---------------|
| **Seuil minimum** | Solde en dessous d'un montant | Solde < Seuil configuré |
| **Prévision négative** | Solde prévu négatif | Projection sur N jours < 0 |
| **Variance** | Écart important vs budget | *À implémenter* |
| **Budget dépassé** | Dépassement budgétaire | *À implémenter* |

### Logique de prévision

La prévision de trésorerie est calculée selon la formule :

```
Solde prévu = Solde actuel + (Moyenne quotidienne × Horizon jours)
```

**Moyenne quotidienne** : basée sur les mouvements comptables des 30 derniers jours.

### Notifications

- **Email** : envoi automatique aux destinataires configurés
- **Activité Odoo** : création d'une tâche pour l'administrateur
- **Historique** : traçabilité complète des déclenchements

### Cooldown

Système de délai entre alertes pour éviter le spam :
- Configurable par alerte (défaut : 24 heures)
- Empêche les déclenchements répétés

## 🔧 Configuration

### 1. Créer une alerte

```python
# Via interface Odoo ou API
alerte = env['quelyos.cash.alert'].create({
    'name': 'Alerte Trésorerie Critique',
    'alert_type': 'threshold',
    'threshold_amount': 10000.0,
    'is_active': True,
    'email_enabled': True,
    'email_recipients': 'finance@quelyos.com,admin@quelyos.com',
    'cooldown_hours': 24,
})
```

### 2. Configuration par type

#### Seuil minimum

```python
{
    'alert_type': 'threshold',
    'threshold_amount': 10000.0,  # Montant seuil
    'account_id': 1,              # Optionnel : surveiller 1 compte
    'portfolio_id': 2,            # Optionnel : surveiller 1 portefeuille
}
```

#### Prévision négative

```python
{
    'alert_type': 'negative_forecast',
    'horizon_days': 30,           # Horizon de prévision (jours)
}
```

### 3. Activation email

```python
{
    'email_enabled': True,
    'email_recipients': 'email1@quelyos.com,email2@quelyos.com',
}
```

## ⏰ Cron Job

**Fréquence** : Toutes les heures

**Méthode** : `quelyos.cash.alert.check_and_trigger()`

### Vérifier le cron

```bash
# Interface Odoo
Paramètres > Technique > Automatisation > Actions planifiées
> "Quelyos Finance: Vérifier alertes de trésorerie"

# Via Python
cron = env.ref('quelyos_finance.ir_cron_check_cash_alerts')
print(f"Actif: {cron.active}")
print(f"Prochain lancement: {cron.nextcall}")
```

### Tester manuellement

```python
# Déclencher la vérification
env['quelyos.cash.alert'].check_and_trigger()

# Tester une alerte spécifique
alerte = env['quelyos.cash.alert'].browse(1)
alerte._trigger_alert()
```

## 📊 Monitoring

### Historique déclenchements

```python
alerte = env['quelyos.cash.alert'].browse(1)
print(f"Déclenchements: {alerte.trigger_count}")
print(f"Dernier: {alerte.last_triggered}")
```

### Dashboard

Les alertes actives sont affichées dans :
- Dashboard Finance (backoffice)
- Interface Odoo (activités)

## 🔍 Logs

```bash
# Voir les logs cron
docker-compose logs -f odoo | grep "check_cash_alerts"

# Voir les erreurs email
docker-compose logs -f odoo | grep "cash_alert.*email"
```

## 🚀 Upgrade module

Après installation ou modification :

```bash
# Commande Claude Code
/upgrade-odoo

# Ou manuellement
docker-compose restart odoo
# Puis dans Odoo: Apps > Quelyos Finance > Mettre à jour
```

## 📧 Template email

Le template email est personnalisable :

**Fichier** : `data/mail_template_cash_alert.xml`

**Preview** : Design moderne avec gradient violet, stats, et CTA

## 🛠️ Développement

### Ajouter un nouveau type d'alerte

1. Ajouter dans `alert_type` selection
2. Implémenter logique dans `check_and_trigger()`
3. Mettre à jour template email

### Modifier la logique de prévision

Éditer `_get_forecast_balance()` dans `models/cash_alert.py`

---

**Version** : 19.0.1.1.0
**Auteur** : Quelyos
**Date** : 2026-01-26

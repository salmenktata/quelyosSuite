# Politique de Dépendances - Quelyos Suite

## Règle Absolue

**Quelyos Suite ne dépend QUE du core Odoo 19 Community Edition.**

Aucune dépendance OCA (Odoo Community Association) ou module tiers n'est autorisée.

## Objectifs

1. **Pérennité** : Éviter les régressions lors de mises à jour de modules tiers
2. **Maintenance simplifiée** : Contrôle total sur le code, debug facilité
3. **Upgrade path clair** : Migration Odoo 19→20→21 sans blocage externe
4. **Isolation** : Garantir que Quelyos Suite fonctionne uniquement avec le core Odoo

## Modules Core Autorisés

### Infrastructure (3 modules)
- `base` - Framework Odoo de base
- `web` - Interface web Odoo
- `mail` - Système de messagerie et activités

### Site Web & E-commerce (2 modules)
- `website` - CMS et site web
- `website_sale` - E-commerce de base

### Ventes & CRM (5 modules)
- `sale_management` - Gestion des ventes
- `crm` - Gestion de la relation client
- `delivery` - Modes de livraison
- `payment` - Systèmes de paiement
- `loyalty` - Programmes de fidélité

### Catalogue & Stock (2 modules)
- `product` - Gestion des produits
- `stock` - Gestion des stocks

### Finance (1 module)
- `account` - Comptabilité de base

### Marketing (1 module)
- `mass_mailing` - Campagnes email

### Autres (1 module)
- `contacts` - Gestion des contacts

### Modules Techniques Autorisés (préfixes)
- `base_%` - Modules techniques core Odoo
- `web_%` - Modules web techniques
- `theme_%` - Thèmes Odoo standard
- `hw_%` - Modules hardware IoT Odoo
- `l10n_%` - Modules de localisation Odoo

**TOTAL : 14 modules core + préfixes techniques**

## Modules Quelyos (100% Natifs)

### Modules Obligatoires
1. **quelyos_core** - Orchestrateur principal et installation automatique
2. **quelyos_api** - Infrastructure multi-tenant et API REST (174 fichiers)

### Modules Optionnels (installés par défaut)
3. **quelyos_stock_advanced** - Inventaire avancé (remplace 3 modules OCA Stock)
   - Remplace : `stock_change_qty_reason`, `stock_inventory`, `stock_location_lockdown`
4. **quelyos_finance** - Gestion trésorerie et budgets
5. **quelyos_sms_tn** - Notifications SMS Tunisie
6. **quelyos_debrand** - Suppression marque Odoo (conformité LGPL)

**TOTAL : 6 modules natifs Quelyos**

## Modules OCA Historiquement Remplacés

### OCA Stock (4 modules - SUPPRIMÉS en v3.0.0)
- ❌ `stock_change_qty_reason` → ✅ `quelyos_stock_advanced`
- ❌ `stock_demand_estimate` → ✅ Non utilisé
- ❌ `stock_inventory` → ✅ `quelyos_stock_advanced`
- ❌ `stock_location_lockdown` → ✅ `quelyos_stock_advanced`

### OCA Marketing (3 modules - JAMAIS utilisés)
- ❌ `mass_mailing_partner` → ✅ Désactivé dès le début
- ❌ `mass_mailing_list_dynamic` → ✅ Désactivé dès le début
- ❌ `mass_mailing_resend` → ✅ Désactivé dès le début

## Processus d'Ajout de Dépendance

**Si une fonctionnalité nécessite un module tiers :**

### Étape 1 : Justification Écrite
- Pourquoi le core Odoo 19 est-il insuffisant ?
- Quelle fonctionnalité critique manque-t-il ?
- Quelle est la valeur ajoutée par rapport au coût de maintenance ?

### Étape 2 : Analyse des Risques
- **Maintenance** : Qui maintient le module ? Fréquence des updates ?
- **Régressions** : Historique de breaking changes ?
- **Upgrade path** : Compatibilité future Odoo 20/21 ?
- **Dépendances** : Le module a-t-il lui-même des dépendances tierces ?

### Étape 3 : Validation Architecture
- Le module s'intègre-t-il proprement avec `quelyos_api` ?
- Y a-t-il des conflits potentiels avec notre multi-tenancy ?
- L'isolation reste-t-elle garantie ?

### Étape 4 : Décision Finale
- **Si accepté** : Internaliser le code (fork dans `quelyos_*` modules)
  - ✅ Contrôle total
  - ✅ Pas de dépendance externe
  - ✅ Customisation possible
- **Si refusé** : Développer une alternative native Quelyos
  - ✅ Code sur-mesure
  - ✅ Maintenance facilitée
  - ✅ Isolation préservée

## Vérification Automatique

### Post-Installation Hook (`quelyos_core`)
Lors de l'installation de `quelyos_core`, un hook vérifie automatiquement :
- Aucun module OCA installé
- Aucun module tiers non-whitelisté
- Logs d'avertissement si modules non-core détectés

```python
# odoo-backend/addons/quelyos_core/__init__.py
ODOO_CORE_WHITELIST = [...]
QUELYOS_MODULES = [...]

def post_init_hook(cr, registry):
    # Vérifier isolation
    forbidden = env['ir.module.module'].search([
        ('state', '=', 'installed'),
        ('name', 'not in', ODOO_CORE_WHITELIST + QUELYOS_MODULES),
        # Exclusions techniques...
    ])
    if forbidden:
        _logger.warning(f"⚠️ MODULES NON-CORE DÉTECTÉS : {forbidden.mapped('name')}")
```

### Pre-Installation Hook (`quelyos_api`)
Bloque l'installation si Odoo != 19 :

```python
# odoo-backend/addons/quelyos_api/__init__.py
def pre_init_hook(cr):
    if odoo.release.version_info[0] != 19:
        raise UserError("Quelyos API requiert Odoo 19.0.x exactement.")
```

### Commande Manuelle
Vérifier l'isolation à tout moment :

```bash
# Via PostgreSQL
psql quelyos_db -c "
  SELECT name FROM ir_module_module
  WHERE state='installed'
  AND (name LIKE 'stock_%' OR name LIKE 'mass_mailing_%')
  AND name NOT IN ('stock', 'mass_mailing');
"

# Résultat attendu : vide (0 lignes)
```

## Historique des Changements

### v3.0.0 (2026-01-29) - Isolation Complète
- **BREAKING CHANGE** : Suppression totale dépendances OCA Stock (4 modules)
- Ajout whitelisting strict dans `quelyos_core/__init__.py`
- Ajout pre_init_hook dans `quelyos_api` (validation Odoo 19)
- Documentation complète de la politique

### v2.0.1 (2026-01-XX) - État Précédent
- Dépendances OCA Stock encore présentes (4 modules)
- Fonctionnalités déjà remplacées par `quelyos_stock_advanced`
- Redondance non critique

### v1.x.x - Début du Projet
- Exploration modules OCA
- Dépendances OCA Marketing commentées dès le début

## Exceptions Autorisées

### Modules Techniques Odoo
Les préfixes suivants sont autorisés car ils font partie du core technique Odoo :
- `base_%` (ex: `base_import`, `base_setup`)
- `web_%` (ex: `web_editor`, `web_kanban`)
- `theme_%` (ex: `theme_default`)
- `hw_%` (ex: `hw_drivers` si IoT utilisé)
- `l10n_%` (ex: `l10n_fr`, `l10n_tn` pour localisation)

### Modules de Localisation
Les modules de localisation Odoo officiels sont autorisés :
- `l10n_tn` - Comptabilité tunisienne (si requis)
- `l10n_fr` - Comptabilité française (si requis)

**IMPORTANT** : Toujours privilégier le minimum de modules de localisation.

## Responsabilités

### Équipe Développement
- Respecter la whitelist stricte
- Ne JAMAIS ajouter de dépendance sans validation
- Tester l'isolation après chaque installation de module
- Documenter toute exception validée

### Lead Technique
- Valider toute nouvelle dépendance (processus 4 étapes)
- Maintenir à jour `ODOO_CORE_WHITELIST` et `QUELYOS_MODULES`
- Réviser la politique annuellement (ou avant migration Odoo majeure)

### Claude Code (Assistant IA)
- Alerter immédiatement si dépendance OCA/tierce suggérée
- Proposer alternatives natives Quelyos en priorité
- Vérifier conformité avant tout commit

## Conséquences de Non-Respect

### Risques Techniques
- Régressions lors de mises à jour OCA
- Conflits de dépendances (cascade de modules)
- Upgrade Odoo bloqué ou complexifié
- Bugs difficiles à tracer (code externe)

### Risques Organisationnels
- Onboarding développeurs ralenti (courbe d'apprentissage OCA)
- Maintenance coûteuse (expertise externe requise)
- Lock-in technologique (dépendance à l'écosystème OCA)

### Impact Utilisateur
- Fonctionnalités cassées après updates
- Downtime imprévu lors de migrations
- Frustration due à bugs non-maîtrisés

## Ressources

### Documentation Officielle
- [Odoo 19 Documentation](https://www.odoo.com/documentation/19.0/)
- [Odoo Community Guidelines](https://github.com/odoo/odoo/wiki)

### Repositories Odoo
- [Odoo Core](https://github.com/odoo/odoo) - Core Odoo 19
- [OCA](https://github.com/OCA) - Modules communautaires (NON utilisés)

### Documentation Interne
- `ARCHITECTURE.md` - Architecture globale Quelyos Suite
- `CLAUDE.md` - Instructions développement Claude Code
- `.claude/API_CONVENTIONS.md` - Conventions API Quelyos

## FAQ

### Q: Pourquoi ne pas utiliser OCA ?
**R:** OCA produit d'excellents modules, MAIS :
- Régressions fréquentes lors de updates
- Maintenance externe (hors contrôle)
- Complexité upgrade Odoo (dépendances multiples)
- Quelyos Suite vise l'autonomie totale et la pérennité

### Q: Que faire si une fonctionnalité OCA est nécessaire ?
**R:** Suivre le processus 4 étapes ci-dessus → **Internaliser** le code :
1. Fork le module OCA dans `quelyos_*`
2. Adapter au multi-tenancy Quelyos
3. Maintenir en interne
4. Aucune dépendance externe

### Q: Les modules de localisation sont-ils autorisés ?
**R:** OUI, uniquement les modules **officiels Odoo** (`l10n_*`) :
- `l10n_tn` pour Tunisie
- `l10n_fr` pour France
- Mais **JAMAIS** de modules OCA de localisation

### Q: Comment vérifier l'isolation après installation ?
**R:** 3 méthodes :
1. Logs Odoo lors de l'installation (post_init_hook `quelyos_core`)
2. Requête SQL (voir section "Vérification Automatique")
3. Interface Odoo : Apps > Filtrer "Installé" > Vérifier liste

### Q: Que se passe-t-il si j'installe un module OCA par erreur ?
**R:**
1. Logs d'avertissement dans `quelyos_core` post_init_hook
2. Désinstaller immédiatement le module OCA
3. Vérifier que les fonctionnalités Quelyos fonctionnent toujours
4. Documenter l'incident pour éviter récurrence

---

**Dernière mise à jour** : 2026-01-29
**Version politique** : 1.0.0
**Auteur** : Équipe Technique Quelyos

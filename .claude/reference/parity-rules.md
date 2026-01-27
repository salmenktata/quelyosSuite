# Parité Fonctionnelle Totale avec Odoo

## Principe
Quelyos Suite = 100% fonctionnalités Odoo + UX exceptionnelle + Force de proposition, SANS modifier Odoo.

### Stratégie de développement
1. **Parité fonctionnelle** : Couvrir 100% des fonctionnalités Odoo actuellement implémentées
2. **Innovation proactive** : S'inspirer de l'écosystème Odoo 19 (Community + Enterprise) pour proposer de nouveaux modules
3. **Enrichissement premium** : Implémenter des fonctionnalités Odoo Enterprise gratuitement dans Quelyos Suite (avantage concurrentiel)
4. **Priorisation** : Backoffice (dashboard-client) > E-commerce (vitrine-client) > Vitrine (vitrine-quelyos)

## Règle 1 : Audit obligatoire avant "module terminé"
1. Lister TOUTES les fonctionnalités Odoo du module
2. Vérifier chaque fonctionnalité dans Quelyos (Backend + Frontend + Backoffice)
3. Documenter dans README.md avec statut : ✅ Implémenté, 🟡 Partiel, 🔴 Manquant
4. Prioriser gaps : P0 (Bloquant), P1 (Important), P2 (Nice-to-have)

## Règle 2 : NE JAMAIS modifier Odoo

### INTERDIT
- Modifier schéma DB Odoo
- Ajouter champs custom aux modèles standards
- Modifier méthodes core Odoo
- Créer tables SQL hors ORM
- Modifier workflows standards

### AUTORISÉ
- API JSON-RPC Odoo (search, read, write, create, unlink)
- Modèles existants (product.template, sale.order, res.partner...)
- Champs calculés Odoo (qty_available, amount_total...)
- State management frontend (Zustand, localStorage)
- Calculs/agrégations côté frontend

## Règle 3 : Consultation écosystème Odoo standard

### OBLIGATOIRE avant tout audit /parity
1. **WebSearch** : Consulter documentation Odoo 19 Community + Enterprise
2. **Identifier** : Modules/fonctionnalités Odoo standard non présents dans Quelyos Suite
3. **Évaluer** : Pertinence pour Backoffice (priorité 1), E-commerce (priorité 2), Vitrine (priorité 3)
4. **Proposer** : Top 3-5 modules/fonctionnalités à développer avec effort estimé

### Sources de référence
- Documentation officielle : https://www.odoo.com/documentation/19.0/
- Modules Community (open source)
- Modules Enterprise (payants, pour inspiration UX)
- Odoo App Store (modules tiers populaires)

## Règle 4 : Alertes immédiates

### CRITIQUES (bloquant)
- Modification schéma DB
- Nouveau modèle custom `quelyos.*`
- Champ stocké sur modèle standard
- API breaking change

### IMPORTANTES (validation requise)
- Fonctionnalité Odoo non implémentée
- Écart fonctionnel vs Odoo natif
- Performance dégradée

## Format tableau correspondance

### Tableau de parité (fonctionnalités existantes)
```markdown
| Fonctionnalité Odoo | Backend | Frontend | Backoffice | Statut | Priorité |
|---------------------|---------|----------|------------|--------|----------|
| Créer produit | POST /api/... | - | ProductForm | ✅ | - |
```

### Tableau opportunités (nouveaux modules à développer)
```markdown
| Module Odoo Standard | Type | Cible Prioritaire | Effort | Impact | Avantage Quelyos | Statut |
|----------------------|------|-------------------|--------|--------|------------------|--------|
| Project Management | Community | Backoffice | Moyen | ★★★★☆ | UX améliorée | 🚀 À développer |
| Subscription | Enterprise ⭐ | E-commerce | Important | ★★★★★ | Gratuit (payant Odoo) | 🚀 À développer |
| Marketing Automation | Enterprise ⭐ | Backoffice | Important | ★★★★★ | Gratuit + Analytics | 🚀 À développer |
```

Légende :
- **Type** :
  - Community (gratuit dans Odoo)
  - Enterprise ⭐ (payant dans Odoo, opportunité de différenciation pour Quelyos Suite)
- **Cible Prioritaire** : Backoffice (P1), E-commerce (P2), Vitrine (P3)
- **Effort** : Faible (< 1 sem), Moyen (1-2 sem), Important (> 2 sem)
- **Impact** : ★☆☆☆☆ à ★★★★★
- **Avantage Quelyos** : Valeur ajoutée spécifique (UX, gratuité, features bonus)
- **Statut** : 🚀 À développer, 🔨 En cours, ✅ Implémenté

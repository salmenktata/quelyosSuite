# Quelyos Suite — Plan Strategique 7 SaaS

## Vision

Transformer Quelyos ERP (8 modules, 101 modeles Odoo, 764 endpoints API) en **suite de 7 SaaS specialises** partageant un backend unique. Chaque SaaS = package transparent de 1 a 3 modules, avec frontend dedie, branding propre et pricing independant.

---

## Architecture Globale

```
+-------------------------------------------------------------+
|              BACKEND UNIQUE (Odoo 19 + PostgreSQL + Redis)   |
|                                                              |
|  101 modeles  -  764 endpoints API  -  Multi-tenant          |
|  quelyos_api + quelyos_finance + quelyos_stock_advanced      |
|  Isolation par company_id  -  JWT Auth  -  TOTP 2FA         |
+----------------------------+--------------------------------+
                             | REST API
        +--------+-------+--+---+-------+-------+-------+
        |        |       |      |       |       |       |
   +----v--++---v---++--v--++--v---++--v---++--v--++---v--+
   |Finance ||Store  ||Copi-||Sales ||Retail||Team ||Supp- |
   |  OS    ||  OS   ||lote ||  OS  ||  OS  || OS  ||ort OS|
   |        ||       || Ops ||      ||      ||     ||      |
   | E49    || E79   ||E99  || E59  ||E129  || E39 || E29  |
   +--------++-------++-----++------++------++-----++------+

   @quelyos/ui-kit (composants partages)
   @quelyos/api-client (client API partage)
   @quelyos/utils (helpers partages)
```

---

## Inventaire Existant Reutilisable

### Backend Odoo (88 modeles, 53 controllers)

| Domaine | Modeles | Endpoints | Statut |
|---------|---------|-----------|--------|
| Finance | budget, portfolio, category, payment_flow, cash_alert, account_move, dunning | 60+ | Production |
| E-commerce | product_template, product_product, sale_order, cart, collection, bundle, flash_sale | 45+ | Production |
| Stock | stock_quant, stock_location, stock_reservation, stock_scrap, cycle_count | 83+ | Production |
| CRM | crm_lead, res_partner, customer_category | 16+ | Production |
| Marketing | marketing_campaign, email_builder, sms_template, marketing_popup, link_tracker | 10+ | Partiel |
| HR | hr_employee, hr_department, hr_job, hr_contract, hr_leave, hr_attendance, hr_appraisal, hr_skill | 40+ | Production |
| POS | pos_config, pos_order, pos_session, pos_payment_method | 22+ | Production |
| Support | ticket, support_template, sla_policy | 12+ | Production |

### Frontend (209 pages, 30+ composants communs)

**Composants UI reutilisables** : Layout, Breadcrumbs, Button, Badge, Input, Modal, ConfirmModal, Toast, Skeleton, Table, DataTable, SearchAutocomplete, BackendImage, ImageGallery, ImageUpload, DateRangePicker, CategoryTree, ErrorBoundary, PageNotice, ModuleSettingsLayout

**Pages par module** : Finance (16), Store (25+), CRM (6+), Stock (7), HR (12), POS (16), Support (2)

---

## Les 7 SaaS — Detail Complet

---

### 1. FINANCE OS

**Positionnement** : Pilotez votre tresorerie en temps reel
**Cible** : TPE/PME, DAF, comptables
**Prix** : E49-99/mois
**Modules Odoo** : finance
**Reutilisation** : 85%

#### Fonctionnalites Existantes (reutilisation directe)
- Dashboard tresorerie avec KPI
- 9 rapports : Cashflow, Forecast 30/60/90/180j, DSO, EBITDA, BFR, Break-even, Profitabilite
- Budgets multi-periodes (weekly/monthly/quarterly/yearly)
- Scenarios what-if (7 variantes -30% a +30%)
- Alertes tresorerie (4 types, email, cooldown)
- Portefeuilles de comptes (regroupement)
- Categories depenses/revenus hierarchiques
- Flux paiement (7 types : cash, card, check, transfer...)
- Import bancaire CSV
- Payment planning fournisseurs

#### A Developper (15%)
- Connexions bancaires Plaid/Open Banking
- Recouvrement etendu (invoices/AR)
- Scoring risque client (0-100)
- ML Forecasting (Prophet/LSTM)
- Scenarios probabilistes (Monte Carlo)
- Workflows automation relances

#### Fichiers Cles
- Backend : quelyos_finance/models/ (budget.py, portfolio.py, category.py, payment_flow.py, cash_alert.py)
- Backend : quelyos_api/models/dunning.py, quelyos_api/controllers/finance_ctrl.py
- Frontend : dashboard-client/src/pages/finance/ (16 pages)

#### Roadmap
- Sprint 1-2 : Setup frontend dedie + copie pages Finance
- Sprint 3-4 : Bank connections (Plaid API)
- Sprint 5-6 : AR/Recovery etendu + Scoring risque
- Sprint 7-8 : Automation workflows
- Sprint 9+ : ML Forecasting, Monte Carlo

---

### 2. STORE OS

**Positionnement** : Creez votre boutique en ligne en 1h
**Cible** : E-commercants, createurs, artisans, marques D2C
**Prix** : E79-149/mois
**Modules Odoo** : store + marketing (partiel)
**Reutilisation** : 80%

#### Fonctionnalites Existantes
- Catalogue produits complet (variantes, attributs, images)
- Categories, Collections, Bundles
- Panier + Checkout
- Commandes (creation, suivi, fulfillment)
- Paiement multi-provider (Stripe, Flouci, Konnect)
- Promotions (codes promo, flash sales, bannieres)
- Avis clients + moderation
- Programme fidelite
- Wishlist
- FAQ + Blog + Pages statiques
- Themes + Hero slides
- Marketing popups + Newsletter
- SMS templates + Email builder
- SEO metadata + Sitemap dynamique
- Link tracker (tracking clics par URL)

#### A Developper (20%)
- Paniers abandonnes (tracking + sequences email)
- Email campaigns completes
- Listes dynamiques (segmentation)
- Analytics e-commerce (funnel, AOV, LTV, cohortes)
- Integrations marketplace (Amazon, Etsy, Instagram Shopping)
- Shipping avance (multi-carrier, tracking, etiquettes)

#### Fichiers Cles
- Backend : quelyos_api/models/product_*.py, sale_order.py, collection.py, bundle.py, flash_sale.py
- Backend : quelyos_api/controllers/products_ctrl.py, orders_ctrl.py, cart_ctrl.py, checkout.py
- Frontend Store : vitrine-client/ (Next.js 16 e-commerce)
- Frontend Admin : dashboard-client/src/pages/store/ (25+ pages)

#### Roadmap
- Sprint 1-2 : Setup frontend admin dedie + copie pages Store
- Sprint 3-4 : Paniers abandonnes + Analytics e-commerce
- Sprint 5-6 : Email campaigns completes
- Sprint 7-8 : Marketplace connectors
- Sprint 9+ : Shipping avance, A/B testing

---

### 3. COPILOTE OPS

**Positionnement** : Reduisez vos arrets de 30% avec la maintenance intelligente
**Cible** : PME industrielles, responsables maintenance, chefs d'atelier
**Prix** : E99-199/mois
**Modules Odoo** : stock + GMAO (nouveau) + hr (techniciens)
**Reutilisation** : 40%

#### Fonctionnalites Existantes (reutilisation)
- Stock pieces : tracabilite lot/SN, mouvements, reservations avec expiration auto
- Inventaires physiques : workflow demarrage/comptage/validation
- Entrepots multi-locations + verrouillage emplacements
- Regles reapprovisionnement automatique
- Valorisation stock + rotation
- RH techniciens : employes, contrats, competences, presences
- Tickets support : workflow SLA complet (base pour interventions)

#### A Developper (60%)
- Gestion equipements (arborescence, criticite, localisation, QR code)
- Interventions (correctif/preventif, checklist, photos, temps passe)
- Planning preventif (gammes, periodicite, calendrier, cron)
- Ordres de travail (affectation, statuts, validation, signature)
- App mobile terrain PWA (Service Worker, IndexedDB, sync offline)
- Checklists parametrables (templates par type)
- KPI maintenance (MTBF, MTTR, disponibilite, backlog, cout)
- Notifications terrain (Push, SMS, WhatsApp)
- Geolocalisation (position techniciens, affectation intelligente)

#### Fichiers Cles
- Backend Stock : quelyos_api/models/stock_quant.py, stock_location.py, stock_reservation.py
- Backend HR : quelyos_api/models/hr_employee.py, hr_attendance.py
- Backend Support : quelyos_api/models/ticket.py (base interventions)
- Frontend : dashboard-client/src/pages/stock/ (7 pages)
- Frontend : dashboard-client/src/pages/hr/ (12 pages)

#### Roadmap
- Sprint 1-4 : Modeles GMAO backend (equipements, interventions, OT)
- Sprint 5-8 : Frontend dashboard GMAO (pages, KPI, planning)
- Sprint 9-12 : App mobile PWA terrain (offline, photos, signature)
- Sprint 13-16 : Maintenance preventive + Analytics MTBF/MTTR
- Sprint 17+ : IoT sensors, predictif, geolocalisation

---

### 4. SALES OS

**Positionnement** : Transformez vos prospects en clients
**Cible** : Equipes commerciales, consultants, agences
**Prix** : E59-129/mois
**Modules Odoo** : crm + marketing
**Reutilisation** : 70%

#### Fonctionnalites Existantes
- Pipeline Kanban (stages configurables)
- Leads/Opportunites (creation, qualification, scoring)
- Gestion clients (categories, historique, interactions)
- Listes de prix (lecture)
- SMS templates + Email builder
- Marketing campaigns (base)
- Marketing popups
- Link tracker (attribution)
- Contact lists
- Factures + Paiements

#### A Developper (30%)
- Pricelists CRUD complet
- Scoring leads automatique (ML)
- Sequences email (drip campaigns J+1/3/7)
- Automation workflows (triggers)
- Prevision ventes (forecast pipeline)
- Activites/Taches (calendar + rappels)
- Reporting commercial (win rate, cycle, performance)
- Integration telephonie (click-to-call)

#### Fichiers Cles
- Backend : quelyos_api/models/crm_lead.py, res_partner.py
- Backend : quelyos_api/models/marketing_campaign.py, email_builder.py
- Backend : quelyos_api/controllers/crm_ctrl.py, customers_ctrl.py
- Frontend : dashboard-client/src/pages/crm/ (6+ pages)
- Frontend : dashboard-client/src/pages/marketing/ (pages campagnes)

#### Roadmap
- Sprint 1-2 : Setup frontend + copie pages CRM + Marketing
- Sprint 3-4 : Pricelists CRUD + Scoring leads
- Sprint 5-6 : Sequences email + Automation
- Sprint 7-8 : Forecast ventes + Reporting
- Sprint 9+ : Telephonie, AI assistant commercial

---

### 5. RETAIL OS

**Positionnement** : Boutique physique + en ligne synchronisees
**Cible** : Retailers, franchises, restauration, food trucks
**Prix** : E129-249/mois
**Modules Odoo** : pos + store + stock
**Reutilisation** : 75%

#### Fonctionnalites Existantes
- Terminal POS (caisse tactile)
- Mode Rush (service rapide)
- Mode Kiosk (self-service)
- Mobile POS (vente en mobilite)
- Kitchen Display System (ecran cuisine)
- Customer Display (ecran client)
- Sessions caisse (ouverture/cloture, comptage)
- Click & Collect (commande online, retrait magasin)
- Stock temps reel multi-entrepots
- Mouvements inter-warehouse
- Catalogue produits + variantes
- Rapports ventes + paiements
- Multi-payment methods

#### A Developper (25%)
- Sync omnicanal temps reel (WebSocket)
- Multi-magasin (dashboard consolide)
- Fidelite omnicanale (points online + offline)
- Barcode scanning (camera mobile)
- Gestion tables restaurant (plan de salle)
- Rapports consolides (CA par magasin, panier moyen)
- Inventaire magasin (comptage rapide par scan)

#### Fichiers Cles
- Backend POS : quelyos_api/models/pos_config.py, pos_order.py, pos_session.py
- Backend Stock : quelyos_api/models/stock_quant.py, stock_location.py
- Backend Store : quelyos_api/models/product_template.py, sale_order.py
- Frontend POS : dashboard-client/src/pages/pos/ (16 pages)
- Frontend Store : dashboard-client/src/pages/store/ (25+ pages)
- Frontend Stock : dashboard-client/src/pages/stock/ (7 pages)

#### Roadmap
- Sprint 1-2 : Setup frontend + fusion POS + Store pages
- Sprint 3-4 : Sync omnicanal WebSocket
- Sprint 5-6 : Multi-magasin dashboard
- Sprint 7-8 : Barcode scanning + Inventaire mobile
- Sprint 9+ : Gestion tables restaurant, analytics avances

---

### 6. TEAM OS

**Positionnement** : Gerez vos equipes sans paperasse
**Cible** : PME, startups, RH
**Prix** : E39-79/mois
**Modules Odoo** : hr
**Reutilisation** : 90%

#### Fonctionnalites Existantes
- Employes (CRUD complet, photo, infos personnelles)
- Departements + Organigramme
- Postes de travail
- Contrats (type, dates, salaire)
- Presences / Pointage
- Conges : demandes, validations, calendrier, allocations, types
- Evaluations / Entretiens annuels
- Competences (skills framework)
- Objectifs (goals)

#### A Developper (10%)
- Self-service employe (portail)
- Onboarding workflow (checklist nouvel employe)
- Offboarding (checklist depart)
- Planning/Shifts (horaires et rotations)
- Notes de frais (soumission + validation)
- Documents RH (GED securisee)
- Rapports RH (turnover, absenteisme, masse salariale)

#### Fichiers Cles
- Backend : quelyos_api/models/hr_employee.py, hr_department.py, hr_job.py, hr_contract.py, hr_leave.py, hr_attendance.py, hr_appraisal.py, hr_skill.py
- Frontend : dashboard-client/src/pages/hr/ (12 pages)

#### Roadmap
- Sprint 1-2 : Setup frontend + copie pages HR
- Sprint 3-4 : Portail self-service employe
- Sprint 5-6 : Onboarding/Offboarding workflows
- Sprint 7-8 : Planning/Shifts + Notes de frais
- Sprint 9+ : GED, rapports avances, paie basique

---

### 7. SUPPORT OS

**Positionnement** : Support client professionnel en 5 minutes
**Cible** : SaaS, e-commerce, services, helpdesk
**Prix** : E29-69/mois
**Modules Odoo** : support + crm (partiel)
**Reutilisation** : 65%

#### Fonctionnalites Existantes
- Tickets (creation, assignation, statuts, priorite)
- SLA policies (deadlines, statuts ok/warning/breached)
- Templates de reponse
- FAQ integree
- Conversation/messages sur tickets
- Satisfaction client

#### A Developper (35%)
- Widget chat integrable (script JS temps reel)
- Knowledge base publique (FAQ + articles + recherche)
- Macros/Automations (reponses automatiques, routing)
- Multi-canal (email, chat, WhatsApp, formulaire)
- Rapports support (resolution, satisfaction, SLA compliance)
- Customer portal (espace client)
- Canned responses (reponses rapides avec variables)
- Collision detection (alerte double reponse)
- AI suggestions (reponse basee sur tickets similaires)

#### Fichiers Cles
- Backend : quelyos_api/models/ticket.py, support_template.py, sla_policy.py
- Backend : quelyos_api/controllers/ticket.py, admin_tickets_ctrl.py
- Frontend : dashboard-client/src/pages/support/ (2 pages)
- Frontend : dashboard-client/src/pages/store/FAQ/ (FAQ existante)

#### Roadmap
- Sprint 1-2 : Setup frontend + enrichir pages support
- Sprint 3-4 : Widget chat integrable + Knowledge base
- Sprint 5-6 : Multi-canal inbox unifiee
- Sprint 7-8 : Automations + Customer portal
- Sprint 9+ : AI suggestions, analytics avances

---

## Architecture Monorepo

### Structure Cible

```
quelyos-suite/
+-- packages/
|   +-- ui-kit/                  # @quelyos/ui-kit
|   |   +-- src/
|   |   |   +-- Button.tsx
|   |   |   +-- Table.tsx
|   |   |   +-- DataTable/
|   |   |   +-- Modal.tsx
|   |   |   +-- Toast.tsx
|   |   |   +-- Skeleton.tsx
|   |   |   +-- Badge.tsx
|   |   |   +-- Input.tsx
|   |   |   +-- Layout.tsx
|   |   |   +-- Breadcrumbs.tsx
|   |   |   +-- PageNotice.tsx
|   |   |   +-- BackendImage.tsx
|   |   |   +-- ImageGallery.tsx
|   |   |   +-- DateRangePicker.tsx
|   |   |   +-- SearchAutocomplete.tsx
|   |   |   +-- index.ts
|   |   +-- package.json
|   |
|   +-- api-client/              # @quelyos/api-client
|   |   +-- src/
|   |   |   +-- client.ts
|   |   |   +-- auth.ts
|   |   |   +-- finance.ts
|   |   |   +-- store.ts
|   |   |   +-- stock.ts
|   |   |   +-- crm.ts
|   |   |   +-- hr.ts
|   |   |   +-- pos.ts
|   |   |   +-- support.ts
|   |   |   +-- index.ts
|   |   +-- package.json
|   |
|   +-- utils/                   # @quelyos/utils
|   |   +-- src/
|   |   |   +-- dates.ts
|   |   |   +-- format.ts
|   |   |   +-- currency.ts
|   |   |   +-- validation.ts
|   |   |   +-- index.ts
|   |   +-- package.json
|   |
|   +-- logger/                  # @quelyos/logger (existant)
|
+-- apps/
|   +-- dashboard-client/        # ERP complet (existant, port 5175)
|   +-- vitrine-quelyos/         # Site marketing (existant, port 3000)
|   +-- vitrine-client/          # E-commerce (existant, port 3001)
|   +-- super-admin-client/      # Admin SaaS (existant, port 9000)
|   |
|   +-- finance-os/              # Finance SaaS (port 3010)
|   +-- store-os/                # Store SaaS (port 3011)
|   +-- copilote-ops/            # GMAO SaaS (port 3012)
|   +-- sales-os/                # CRM SaaS (port 3013)
|   +-- retail-os/               # Retail SaaS (port 3014)
|   +-- team-os/                 # RH SaaS (port 3015)
|   +-- support-os/              # Support SaaS (port 3016)
|
+-- odoo-backend/                # Backend Odoo (existant, port 8069)
|
+-- turbo.json                   # Turborepo config
+-- pnpm-workspace.yaml          # Workspace config
+-- package.json
```

---

## Strategie Pricing

### Pricing Individuel

| SaaS | Starter | Pro | Business |
|------|---------|-----|----------|
| Quelyos Support | E29/mois | E49/mois | E69/mois |
| Quelyos Team | E39/mois | E59/mois | E79/mois |
| Quelyos Finance | E49/mois | E79/mois | E99/mois |
| Quelyos Sales | E59/mois | E99/mois | E129/mois |
| Quelyos Store | E79/mois | E119/mois | E149/mois |
| Quelyos Copilote | E99/mois | E149/mois | E199/mois |
| Quelyos Retail | E129/mois | E199/mois | E249/mois |

### Bundles

| Bundle | Composition | Prix | Economie |
|--------|-------------|------|----------|
| Starter Pack | Quelyos Team + Quelyos Finance | E79/mois | -10% |
| Growth Pack | Finance + Sales + Quelyos Store | E199/mois | -12% |
| Industry Pack | Quelyos Copilote + Finance + Quelyos Team | E179/mois | -15% |
| Retail Pack | Quelyos Retail + Quelyos Finance | E159/mois | -12% |
| Full Suite | Tous les modules | E399/mois | -22% |

### Upsell Path

```
Entree Quelyos Team (E39) -> + Finance (E49) = Starter Pack (E79)
                      -> + Sales (E59) = Growth direction
                      -> + Store (E79) = Full e-commerce

Entree Quelyos Finance (E49) -> + Sales (E59) = Growth Pack (E199)
                        -> + Quelyos Copilote (E99) = Industry Pack (E179)

Entree Quelyos Store (E79) -> + Retail (E129) = Retail Pack (E159)
                      -> + Finance (E49) = Growth Pack (E199)
```

---

## Branding & Design System

### Identite par SaaS

| SaaS | Couleur Primaire | Icone | Domaine |
|------|-----------------|-------|---------|
| Quelyos Finance | #059669 (Emerald 600) | TrendingUp | finance-os.quelyos.com |
| Quelyos Store | #7C3AED (Violet 600) | ShoppingBag | store-os.quelyos.com |
| Quelyos Copilote | #EA580C (Orange 600) | Wrench | copilote-ops.quelyos.com |
| Quelyos Sales | #2563EB (Blue 600) | Target | sales-os.quelyos.com |
| Quelyos Retail | #DC2626 (Red 600) | Store | retail-os.quelyos.com |
| Quelyos Team | #0891B2 (Cyan 600) | Users | team-os.quelyos.com |
| Quelyos Support | #9333EA (Purple 600) | Headphones | support-os.quelyos.com |

---

## Roadmap Globale (18 mois)

### Phase 0 — Infrastructure (Semaines 1-4)
- Setup Turborepo + pnpm workspace
- Extraction @quelyos/ui-kit depuis dashboard-client
- Extraction @quelyos/api-client
- Extraction @quelyos/utils
- Template app SaaS (Vite + React 19 + Tailwind + Zustand)
- CI/CD pipeline par app (GitHub Actions)
- Domaines et certificats SSL

### Phase 1 — Quelyos Finance (Semaines 5-14)
- Frontend Quelyos Finance (pages Finance copiees/adaptees)
- Branding + Onboarding simplifie
- Bank connections (Plaid/Open Banking)
- Recouvrement etendu + Scoring risque
- Landing page + Pilotes (3-5 entreprises)
- Tests end-to-end

### Phase 2 — Quelyos Store (Semaines 10-18)
- Frontend Quelyos Store (pages Store + Marketing copiees)
- Paniers abandonnes + Recuperation
- Email campaigns completes
- Analytics e-commerce (funnel, AOV, LTV)
- Landing page + Pilotes

### Phase 3 — Quelyos Copilote Backend (Semaines 12-24)
- Modeles GMAO Odoo (equipment, intervention, work_order, maintenance_plan)
- API endpoints GMAO
- Frontend dashboard GMAO
- KPI maintenance (MTBF, MTTR)
- App mobile PWA terrain

### Phase 4 — Quelyos Sales + Quelyos Team (Semaines 20-28)
- Quelyos Sales frontend (CRM + Marketing)
- Scoring leads + Automation workflows
- Quelyos Team frontend (HR)
- Self-service employe + Onboarding

### Phase 5 — Quelyos Retail + Quelyos Support (Semaines 26-36)
- Quelyos Retail frontend (POS + Store + Stock)
- Sync omnicanal WebSocket
- Quelyos Support frontend (Tickets + KB)
- Widget chat integrable
- Multi-canal inbox

### Phase 6 — Optimisations (Semaines 34-40)
- Performance audit toutes apps
- A/B testing pricing
- Analytics cross-app
- Documentation developpeur (API)
- Marketplace integrations

---

## Backend — Nouveaux Modeles Odoo

### Quelyos Finance

```python
class BankConnection(models.Model):
    _name = 'quelyos.bank.connection'
    provider = fields.Selection([('plaid', 'Plaid'), ('open_banking', 'Open Banking'), ('csv', 'CSV Import')])
    institution_name = fields.Char()
    credentials = fields.Text()  # encrypted
    last_sync = fields.Datetime()
    sync_status = fields.Selection([('active', 'Active'), ('error', 'Error'), ('expired', 'Expired')])

class ClientRiskScore(models.Model):
    _name = 'quelyos.client.risk.score'
    partner_id = fields.Many2one('res.partner')
    score = fields.Integer()  # 0-100
    risk_level = fields.Selection([('low', 'Low'), ('medium', 'Medium'), ('high', 'High')])
    factors = fields.Text()  # JSON
    recommendations = fields.Text()  # JSON
```

### Quelyos Copilote

```python
class Equipment(models.Model):
    _name = 'gmao.equipment'
    name = fields.Char(required=True)
    code = fields.Char()  # QR/Barcode
    category_id = fields.Many2one('gmao.equipment.category')
    parent_id = fields.Many2one('gmao.equipment')  # arborescence
    location = fields.Char()
    criticality = fields.Selection([('low', 'Low'), ('medium', 'Medium'), ('high', 'High'), ('critical', 'Critical')])
    status = fields.Selection([('operational', 'Operational'), ('maintenance', 'Maintenance'), ('broken', 'Broken'), ('decommissioned', 'Decommissioned')])
    installation_date = fields.Date()
    last_maintenance = fields.Datetime()
    next_maintenance = fields.Datetime()
    technical_doc = fields.Binary()

class Intervention(models.Model):
    _name = 'gmao.intervention'
    equipment_id = fields.Many2one('gmao.equipment', required=True)
    type = fields.Selection([('corrective', 'Corrective'), ('preventive', 'Preventive'), ('inspection', 'Inspection')])
    priority = fields.Selection([('low', 'Low'), ('medium', 'Medium'), ('high', 'High'), ('urgent', 'Urgent')])
    state = fields.Selection([('draft', 'Draft'), ('planned', 'Planned'), ('in_progress', 'In Progress'), ('done', 'Done'), ('cancelled', 'Cancelled')])
    technician_id = fields.Many2one('hr.employee')
    planned_date = fields.Datetime()
    actual_start = fields.Datetime()
    actual_end = fields.Datetime()
    duration = fields.Float(compute='_compute_duration')
    checklist_ids = fields.One2many('gmao.checklist.item', 'intervention_id')
    parts_consumed = fields.One2many('gmao.part.consumption', 'intervention_id')
    photos = fields.Many2many('ir.attachment')
    notes = fields.Text()
    signature = fields.Binary()

class MaintenancePlan(models.Model):
    _name = 'gmao.maintenance.plan'
    equipment_id = fields.Many2one('gmao.equipment')
    name = fields.Char()
    frequency = fields.Selection([('daily', 'Daily'), ('weekly', 'Weekly'), ('monthly', 'Monthly'), ('quarterly', 'Quarterly'), ('yearly', 'Yearly')])
    interval = fields.Integer(default=1)
    checklist_template_id = fields.Many2one('gmao.checklist.template')
    next_execution = fields.Datetime()
    active = fields.Boolean(default=True)
```

---

## Tests & Verification

### Par SaaS
1. Smoke tests : Login, navigation, CRUD principal
2. Integration tests : API backend - frontend
3. E2E tests : Parcours utilisateur complet (Playwright)
4. Performance : Lighthouse score > 90
5. Securite : OWASP top 10, isolation tenant

### Cross-SaaS
1. Isolation donnees : client Quelyos Finance ne voit pas donnees Quelyos Store
2. Upgrade bundle : Quelyos Finance -> Growth Pack sans perte de donnees
3. UI consistency : composants @quelyos/ui-kit identiques partout
4. Auth unifiee : SSO entre apps de la meme suite

---

## Risques & Mitigation

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Duplication code entre apps | Maintenance x7 | Monorepo + @quelyos/ui-kit strict |
| Confusion branding (7 marques) | Dilution | Sous-marques by Quelyos + landing unifiee |
| Effort developpement sous-estime | Retard | MVP ultra-minimal par app, iterer |
| Cannibalisation ERP complet | Revenue | Pricing bundles attractifs - upsell Suite |
| Complexite infrastructure | Ops overhead | 1 backend unique, CI/CD automatise |
| Support client multi-app | Cout support | Knowledge base commune, chatbot |

---

## Resume Executif

| Metrique | Valeur |
|----------|--------|
| SaaS a lancer | 7 |
| Backend | 1 unique (Odoo 19) |
| Reutilisation moyenne | 72% |
| Duree totale | 18 mois |
| Revenue potentielle | E29-399/mois/client |
| Priority order | Quelyos Finance - Quelyos Store - Quelyos Copilote - Quelyos Sales - Quelyos Team - Quelyos Retail - Quelyos Support |

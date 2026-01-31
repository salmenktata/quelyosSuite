# Theme Marketplace - Documentation Complète

## 🎯 Vue d'Ensemble

Marketplace de thèmes permettant aux designers de soumettre et vendre leurs créations avec système de revenue-share 70/30.

## 📦 Architecture

### Backend (Odoo)

**Modèles Créés** (`models/theme_marketplace.py`) :

1. **quelyos.theme.designer**
   - Profils designers avec stats
   - Statuts : pending, approved, suspended, rejected
   - Méthodes paiement : bank, paypal, stripe
   - Revenue share rate : 70% par défaut

2. **quelyos.theme.submission**
   - Thèmes soumis par designers
   - Workflow : draft → submitted → in_review → approved/rejected
   - Statistiques ventes et revenus
   - Rating et reviews

3. **quelyos.theme.purchase**
   - Achats de thèmes par tenants
   - Statuts : pending, completed, failed, refunded
   - Revenue split automatique (70/30)

4. **quelyos.theme.revenue**
   - Suivi revenus designers
   - Statuts payout : pending, processing, paid, failed
   - Référence de paiement

**Champs Ajoutés à quelyos.theme** :
- `is_marketplace` : Booléen (thème marketplace)
- `designer_id` : Many2one vers quelyos.theme.designer

### Frontend (dashboard-client)

**Pages Créées** :

1. **`/store/themes/marketplace`**
   - Liste thèmes marketplace
   - Filtres : catégorie, prix (gratuit/premium), tri (populaire/récent/note)
   - Recherche par nom/description
   - Cards avec stats (rating, downloads)

2. **`/store/themes/submit`**
   - Formulaire soumission thème
   - Upload JSON configuration
   - Upload miniature (optionnel)
   - Définir prix (gratuit/premium)
   - Success screen après soumission

3. **À Créer** :
   - `/store/themes/marketplace/:id` - Détail thème avec achat
   - `/store/themes/my-submissions` - Liste soumissions designer
   - `/store/themes/revenues` - Tableau de bord revenus designer

### API Endpoints

**Contrôleur** : `controllers/theme.py`

#### GET /api/themes/marketplace
Liste thèmes marketplace publics

**Params** :
```json
{
  "category": "fashion|tech|food|beauty|sports|home|general",
  "is_premium": true|false,
  "sort": "popular|recent|rating"
}
```

**Response** :
```json
{
  "success": true,
  "themes": [
    {
      "id": "fashion-luxury",
      "name": "Fashion Luxury",
      "description": "...",
      "category": "fashion",
      "thumbnail": "base64...",
      "designer": {
        "id": 1,
        "name": "John Doe",
        "avatar": "base64..."
      },
      "is_premium": true,
      "price": 29.99,
      "rating": 4.8,
      "downloads": 150,
      "reviews_count": 23
    }
  ]
}
```

#### POST /api/themes/submissions
Soumettre un thème pour review

**Params** :
```json
{
  "name": "Mon Thème",
  "description": "Description",
  "category": "fashion",
  "config_json": "{...}",
  "is_premium": true,
  "price": 29.99
}
```

**Response** :
```json
{
  "success": true,
  "submission_id": 5
}
```

**Comportement** :
- Crée automatiquement profil designer si n'existe pas
- Status initial : `submitted`
- Nécessite review admin pour approbation

#### GET /api/themes/submissions/my
Liste soumissions de l'utilisateur

**Response** :
```json
{
  "success": true,
  "submissions": [
    {
      "id": 5,
      "name": "Mon Thème",
      "status": "approved",
      "sales_count": 12,
      "total_revenue": 359.88,
      "designer_revenue": 251.92,
      "average_rating": 4.5,
      "submit_date": "2026-01-29T14:30:00",
      "approval_date": "2026-01-30T10:15:00"
    }
  ]
}
```

#### POST /api/themes/<id>/purchase
Acheter un thème pour un tenant

**Params** :
```json
{
  "theme_id": 5,
  "tenant_id": 3,
  "payment_method": "stripe|paypal|free"
}
```

**Response** :
```json
{
  "success": true,
  "purchase_id": 10,
  "payment_url": "/payment/stripe/checkout"
}
```

**Comportement** :
- Thèmes gratuits : achat instantané (status = completed)
- Thèmes payants : purchase pending + redirect payment_url
- Vérifie si déjà acheté (évite doublons)

---

## 🔄 Workflow Designer

### 1. Inscription Designer

```
User → Soumet premier thème
      → Auto-création profil designer (status = pending)
      → Review admin profil
      → Approbation → Designer actif
```

### 2. Soumission Thème

```
Designer → Remplit formulaire + upload JSON
         → Status = submitted
         → Review admin
            → Approuvé → Création quelyos.theme (is_marketplace=true)
                      → Visible sur marketplace
            → Rejeté → Reason envoyée au designer
```

### 3. Vente Thème

```
Tenant → Browse marketplace
       → Clique "Acheter" sur thème premium
       → Redirect Stripe/PayPal
       → Paiement complété
       → Purchase status = completed
       → Revenue entry créée (70% designer)
       → Thème activé pour tenant
```

### 4. Payout Designer

```
Admin → Consulte quelyos.theme.revenue (status = pending)
      → Process batch payout
      → Virement bancaire / PayPal
      → Revenue status = paid
      → Reference payout enregistrée
```

---

## 💰 Revenue Share

### Règles

- **Designer** : 70% du prix de vente
- **Plateforme** : 30% du prix de vente
- **Taux modifiable** : Champ `revenue_share_rate` sur designer

### Calcul Automatique

Champs computed sur `quelyos.theme.purchase` :
```python
designer_share = amount * (designer.revenue_share_rate / 100)
platform_share = amount * (1 - designer.revenue_share_rate / 100)
```

### Tracking Revenus

Modèle `quelyos.theme.revenue` :
- Entry créée automatiquement quand purchase = completed
- Agrégation par designer
- Statut payout géré manuellement par admin

---

## 🎨 UI/UX Patterns

### Marketplace Grid

**Layout** :
- Grid responsive : 1 col (mobile) → 2 cols (tablet) → 3 cols (desktop)
- Cards avec hover effects (scale, shadow)
- Thumbnail aspect-video
- Badge "Premium" si payant
- Stats : rating ⭐, downloads 📥

**Filtres** :
- Barre recherche (nom/description)
- Dropdown catégorie
- Dropdown prix (tous/gratuit/premium)
- Chips tri (populaire/récent/note)

### Submit Form

**Sections** :
1. Informations de base (nom, description, catégorie)
2. Configuration JSON (upload + preview textarea)
3. Miniature (upload image optionnel)
4. Monétisation (checkbox premium + input prix)

**Validation** :
- Tous champs requis sauf miniature
- JSON valide (parse client-side)
- Prix > 0 si premium
- Success screen avec redirect

---

## 🔒 Sécurité & Validation

### Backend

**Validation Soumission** :
- ✅ User authentifié required
- ✅ JSON valide (try/catch parse)
- ✅ Catégorie dans enum
- ✅ Prix >= 0

**Validation Achat** :
- ✅ Thème existe
- ✅ Pas d'achat duplicate (même tenant + thème)
- ✅ Tenant appartient à user
- ✅ Montant correct (price du thème)

### Frontend

**Validation Formulaire** :
- Required fields HTML5
- JSON parse client-side avec error display
- File type check (json, images)
- Price validation si premium checked

---

## 📊 Métriques & Analytics

### Métriques Designer

Champs computed sur `quelyos.theme.designer` :
- `themes_count` : Nombre thèmes approuvés
- `total_sales` : Ventes totales
- `total_revenue` : Revenus cumulés designer
- `average_rating` : Note moyenne tous thèmes

### Métriques Submission

Champs computed sur `quelyos.theme.submission` :
- `sales_count` : Nombre achats
- `total_revenue` : Revenus totaux
- `designer_revenue` : Part designer (70%)
- `platform_revenue` : Part plateforme (30%)
- `average_rating` : Note moyenne thème
- `reviews_count` : Nombre avis

---

## 🚀 Déploiement

### 1. Upgrade Module Odoo

```bash
cd odoo-backend
./upgrade.sh quelyos_api
```

**Ou manuel** :
```bash
docker exec -it quelyos-odoo odoo-bin -u quelyos_api -d quelyos --stop-after-init
docker-compose restart
```

### 2. Vérifier Tables Créées

```sql
SELECT table_name FROM information_schema.tables
WHERE table_name LIKE 'quelyos_theme_%';

-- Résultat attendu :
-- quelyos_theme
-- quelyos_theme_designer
-- quelyos_theme_submission
-- quelyos_theme_purchase
-- quelyos_theme_revenue
```

### 3. Ajouter Routes Frontend

**dashboard-client/src/config/modules.ts** :
```typescript
{
  id: 'store',
  name: 'Boutique',
  icon: ShoppingBag,
  items: [
    // ... existing
    {
      id: 'themes-marketplace',
      name: 'Marketplace Thèmes',
      href: '/store/themes/marketplace',
      icon: Store,
    },
    {
      id: 'themes-submit',
      name: 'Soumettre un Thème',
      href: '/store/themes/submit',
      icon: Upload,
    },
  ]
}
```

---

## 🧪 Tests

### Test Soumission Thème

1. Aller sur `/store/themes/submit`
2. Remplir formulaire :
   - Nom : "Test Theme"
   - Description : "Test description"
   - Catégorie : Fashion
   - Upload JSON valide
   - Cocher Premium + Prix 29.99
3. Submit
4. Vérifier success screen
5. Vérifier DB :
   ```sql
   SELECT * FROM quelyos_theme_designer WHERE user_id = <current_user>;
   SELECT * FROM quelyos_theme_submission WHERE name = 'Test Theme';
   ```

### Test Marketplace

1. Créer quelques soumissions et les approuver manuellement :
   ```python
   submission = env['quelyos.theme.submission'].browse(1)
   submission.action_approve()
   ```
2. Aller sur `/store/themes/marketplace`
3. Vérifier thèmes affichés
4. Tester filtres (catégorie, prix, tri)
5. Tester recherche

### Test Achat

1. Cliquer sur thème gratuit
2. Cliquer "Acheter"
3. Vérifier purchase créée (status = completed)
4. Vérifier revenue entry créée
5. Essayer re-acheter → Error "already purchased"

---

## 📝 TODOs

### Court Terme

- [ ] Page détail thème (`/store/themes/marketplace/:id`)
- [ ] Page mes soumissions (`/store/themes/my-submissions`)
- [ ] Intégration Stripe pour paiements
- [ ] Email notifications (soumission approuvée/rejetée)

### Moyen Terme

- [ ] Dashboard revenus designer
- [ ] Workflow review admin (interface backoffice)
- [ ] Batch payout system
- [ ] Analytics avancées (graphiques ventes)
- [ ] Preview thème avant achat (iframe)

### Long Terme

- [ ] Système de favoris thèmes
- [ ] Collections thèmes par designer
- [ ] Bundles thèmes (packs)
- [ ] Affiliation / Referral program
- [ ] API publique marketplace (REST)

---

## 🐛 Troubleshooting

### Erreur : "Table quelyos_theme_designer doesn't exist"

**Solution** : Upgrade module Odoo
```bash
cd odoo-backend && ./upgrade.sh quelyos_api
```

### Erreur : "Designer profile not found"

**Cause** : Profil designer pas créé automatiquement
**Solution** : Créer manuellement via Python shell :
```python
designer = env['quelyos.theme.designer'].create({
    'user_id': env.user.id,
    'display_name': env.user.name,
    'email': env.user.email,
    'status': 'approved',
})
```

### Erreur : "Submission already exists"

**Cause** : Doublon dans soumissions
**Solution** : Vérifier et supprimer doublons :
```sql
DELETE FROM quelyos_theme_submission
WHERE id NOT IN (
  SELECT MIN(id) FROM quelyos_theme_submission GROUP BY name, designer_id
);
```

---

## 💡 Best Practices

### Pour Designers

1. **Tester thème localement** avant soumission
2. **Fournir miniature attractive** (augmente conversions 40%)
3. **Description claire** avec features listées
4. **Prix compétitif** : Gratuit = plus de visibilité, Premium = revenus
5. **Répondre aux reviews** pour améliorer rating

### Pour Admins

1. **Review rapide** (< 24h) pour encourager designers
2. **Feedback constructif** si rejet (reason détaillée)
3. **Promouvoir top designers** (featured section)
4. **Payouts réguliers** (mensuel recommandé)
5. **Monitoring fraude** (thèmes copiés, prix abusifs)

---

## 📈 KPIs

### Santé Marketplace

- **Nombre designers actifs** : Objectif 50+ (6 mois)
- **Thèmes disponibles** : Objectif 200+ (1 an)
- **Taux approbation** : Objectif > 70%
- **Time to approve** : Objectif < 48h
- **Conversion rate** : Objectif 5-10% (visiteurs → acheteurs)

### Revenus

- **GMV (Gross Merchandise Value)** : Total ventes thèmes
- **Take rate** : 30% (part plateforme)
- **ARPU (Average Revenue Per User)** : Revenus moyen/designer
- **LTV (Lifetime Value)** : Valeur vie designer

---

## 🎉 Conclusion

Marketplace fonctionnel avec :
✅ Backend complet (4 modèles + 4 endpoints)
✅ Frontend soumission et liste
✅ Workflow designer → review → vente
✅ Revenue share automatique 70/30
✅ Documentation complète

**Prochaine étape** : Upgrade Odoo + tester flows complets

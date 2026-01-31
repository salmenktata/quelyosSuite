# Guide d'Intégration Stripe - Paiements Marketplace Thèmes

## 📋 Fichiers Créés

### Backend Odoo
1. **`controllers/payment_stripe.py`** (330 lignes)
   - Endpoint `/api/themes/<id>/stripe/create-payment-intent`
   - Endpoint webhook `/api/stripe/webhook`
   - Gestion payment_intent.succeeded / payment_intent.payment_failed

2. **Modèle `quelyos.theme.purchase`** (modifié)
   - Champ `stripe_payment_intent_id` ajouté

3. **`requirements.txt`** (modifié)
   - Dépendance `stripe>=7.0.0,<8.0.0` ajoutée

### Frontend Dashboard
4. **`components/stripe/ThemeCheckoutForm.tsx`** (créé)
   - Formulaire paiement avec Stripe Elements
   - CardElement sécurisé PCI DSS
   - Flow: createPaymentIntent → confirmPayment → success

---

## 🔧 Configuration Requise

### 1. Paramètres Système Odoo

Configurer 2 paramètres dans **Paramètres > Technique > Paramètres Système** :

```python
# Clé secrète Stripe (sk_test_xxx ou sk_live_xxx)
payment.stripe.secret_key = "sk_test_..."

# Webhook secret Stripe (whsec_xxx)
payment.stripe.webhook_secret = "whsec_..."
```

### 2. Webhook Stripe Dashboard

Configurer webhook dans Stripe Dashboard :
- URL : `https://api.quelyos.com/api/stripe/webhook`
- Événements :
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`

---

## 🔄 Flow Complet Paiement

```
1. User clique "Acheter" sur thème premium
   ↓
2. Frontend appelle POST /api/themes/{id}/stripe/create-payment-intent
   ↓
3. Backend crée Payment Intent Stripe + Purchase (status: pending)
   ↓
4. Frontend affiche formulaire Stripe Elements
   ↓
5. User entre carte et confirme
   ↓
6. stripe.confirmCardPayment() avec client_secret
   ↓
7. Si 3D Secure requis, modal Stripe s'affiche
   ↓
8. Paiement confirmé
   ↓
9. Webhook Stripe appelle /api/stripe/webhook (payment_intent.succeeded)
   ↓
10. Backend met à jour Purchase (status: completed)
    ↓
11. Backend crée Revenue (70% designer, 30% platform)
    ↓
12. Frontend affiche confirmation achat
```

---

## 📦 Intégration dans Page Détail Thème

### Modification de `marketplace/[id].tsx`

#### Étape 1 : Installer dépendances

```bash
cd dashboard-client
pnpm add @stripe/stripe-js @stripe/react-stripe-js
```

#### Étape 2 : Ajouter provider Stripe au layout

```tsx
// dashboard-client/src/main.tsx ou App.tsx
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Wrapper app
<Elements stripe={stripePromise}>
  <RouterProvider router={router} />
</Elements>
```

#### Étape 3 : Modifier page marketplace/[id].tsx

```tsx
import { useState } from 'react';
import { ThemeCheckoutForm } from '@/components/stripe/ThemeCheckoutForm';
import { Dialog } from '@/components/common'; // Votre composant modal

function ThemeDetailPage() {
  const [showCheckout, setShowCheckout] = useState(false);
  const [purchased, setPurchased] = useState(false);

  const handlePurchase = () => {
    if (theme.is_premium && theme.price > 0) {
      // Ouvrir modal Stripe pour thèmes premium
      setShowCheckout(true);
    } else {
      // Achat gratuit direct (logique existante)
      handleFreePurchase();
    }
  };

  const handleFreePurchase = async () => {
    // Logique existante pour thèmes gratuits
    const response = await fetch(...);
    if (response.ok) {
      setPurchased(true);
    }
  };

  const handlePaymentSuccess = () => {
    setShowCheckout(false);
    setPurchased(true);
  };

  return (
    <>
      {/* Page existante */}
      <Button onClick={handlePurchase}>
        {theme.is_premium ? 'Acheter Maintenant' : 'Obtenir Gratuitement'}
      </Button>

      {/* Modal Stripe Checkout */}
      {showCheckout && (
        <Dialog
          open={showCheckout}
          onClose={() => setShowCheckout(false)}
          title="Paiement Sécurisé"
        >
          <ThemeCheckoutForm
            themeId={theme.id}
            themeName={theme.name}
            price={theme.price}
            currency="USD"
            tenantId={currentTenantId}
            onSuccess={handlePaymentSuccess}
            onCancel={() => setShowCheckout(false)}
          />
        </Dialog>
      )}
    </>
  );
}
```

---

## 🧪 Tests

### Test Mode Stripe

1. **Clés test Stripe** :
   ```
   Publishable: pk_test_...
   Secret: sk_test_...
   ```

2. **Cartes test** :
   ```
   Succès : 4242 4242 4242 4242
   3D Secure : 4000 0025 0000 3155
   Décliné : 4000 0000 0000 9995
   ```

3. **Date expiration** : N'importe quelle date future
4. **CVC** : N'importe quel 3 chiffres

### Test Local Webhook

```bash
# Installer Stripe CLI
brew install stripe/stripe-brew/stripe

# Se connecter
stripe login

# Forwarder webhook vers local
stripe listen --forward-to http://localhost:8069/api/stripe/webhook

# Déclencher événement test
stripe trigger payment_intent.succeeded
```

---

## 🔐 Sécurité

### ✅ Bonnes Pratiques Implémentées

1. **Clés serveur uniquement** :
   - `secret_key` jamais exposée frontend
   - Stockée dans `ir.config_parameter` (encrypted)

2. **Webhook signature** :
   - Vérification signature Stripe (`stripe.Webhook.construct_event`)
   - Protection contre replay attacks

3. **Idempotence** :
   - Vérification `purchase.status == 'completed'` dans webhook
   - Évite double traitement

4. **PCI DSS** :
   - Utilisation Stripe Elements (iframe sécurisé)
   - Aucune donnée carte ne transite par nos serveurs

5. **3D Secure** :
   - Automatique via `stripe.confirmCardPayment()`
   - Modal Stripe géré côté client

### ⚠️ À Faire en Production

1. **Variables d'environnement** :
   ```bash
   # .env.production
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
   ```

2. **Webhook signature** :
   - Configurer `payment.stripe.webhook_secret` avec clé live

3. **HTTPS obligatoire** :
   - Webhook Stripe requis HTTPS

4. **Logs monitoring** :
   - Logger tous webhooks reçus
   - Alertes sur échecs paiement

---

## 💰 Revenue Split Automatique

### Calcul Automatique

Le webhook `payment_intent.succeeded` crée automatiquement un `quelyos.theme.revenue` :

```python
# Calcul dans _handle_payment_success()
designer_amount = amount * (designer.revenue_share_rate / 100)  # 70%
platform_amount = amount - designer_amount                       # 30%

revenue = env['quelyos.theme.revenue'].create({
    'purchase_id': purchase.id,
    'designer_id': designer.id,
    'amount': amount,
    'designer_share': designer_amount,
    'platform_share': platform_amount,
    'status': 'pending',  # En attente payout
})
```

### Dashboard Designer

Le designer peut voir ses revenus dans `/store/themes/my-submissions` :
- Total ventes
- Revenus totaux (70%)
- Revenus en attente payout
- Historique transactions

---

## 📊 Prochaines Étapes

### Phase 2 : Payouts Automatiques (Task #11)

1. **Stripe Connect** :
   - Onboarding designers avec Connect
   - Champ `stripe_connect_account_id` dans `quelyos.theme.designer`

2. **Endpoint payout** :
   ```python
   @http.route('/api/themes/designers/payout', ...)
   def trigger_designer_payout(self, designer_id, amount):
       stripe.Transfer.create(
           amount=int(amount * 100),
           currency='usd',
           destination=designer.stripe_connect_account_id,
           transfer_group=f'designer_{designer_id}',
       )
   ```

3. **Cron job mensuel** :
   - Payout automatique tous les 1er du mois
   - Minimum 50 USD pour déclencher

4. **Webhook `transfer.paid`** :
   - Marquer `quelyos.theme.revenue.status = 'paid'`

---

## 🐛 Troubleshooting

### Erreur "Stripe not configured"

**Cause** : Clé secrète manquante
**Solution** :
```python
# Odoo Shell
env['ir.config_parameter'].sudo().set_param(
    'payment.stripe.secret_key',
    'sk_test_...'
)
```

### Webhook ne se déclenche pas

**Cause** : Signature invalide ou endpoint inaccessible
**Solutions** :
1. Vérifier `payment.stripe.webhook_secret` configuré
2. Tester avec Stripe CLI : `stripe listen --forward-to ...`
3. Vérifier logs Odoo : `docker-compose logs -f odoo`

### Paiement bloqué à "pending"

**Cause** : Webhook non reçu
**Solutions** :
1. Vérifier webhook configuré dans Stripe Dashboard
2. Vérifier URL publique accessible (HTTPS)
3. Manuellement compléter purchase via Odoo backend

### Erreur 3D Secure

**Cause** : Modal Stripe bloquée ou timeout
**Solutions** :
1. Vérifier pop-ups autorisés navigateur
2. Tester avec carte sans 3DS : `4242 4242 4242 4242`
3. Augmenter timeout côté client

---

## 📝 Checklist Go-Live

- [ ] Clés Stripe live configurées (pk_live_, sk_live_)
- [ ] Webhook configuré Stripe Dashboard (HTTPS)
- [ ] Webhook secret configuré Odoo
- [ ] Tests paiement end-to-end (succès/échec/3DS)
- [ ] Logs monitoring configurés
- [ ] Alertes échecs paiement
- [ ] Dashboard designer fonctionnel
- [ ] CGV marketplace à jour (mentions Stripe)
- [ ] Support client briefé (remboursements)

---

## 📚 Ressources

- [Stripe Elements Documentation](https://stripe.com/docs/stripe-js)
- [Payment Intents API](https://stripe.com/docs/payments/payment-intents)
- [Webhooks Best Practices](https://stripe.com/docs/webhooks/best-practices)
- [Testing Cards](https://stripe.com/docs/testing)

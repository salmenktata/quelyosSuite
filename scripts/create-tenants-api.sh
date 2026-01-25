#!/bin/bash
# Création des tenants via API REST Odoo

API_URL="http://localhost:8069"
DB="quelyos"
LOGIN="admin"
PASSWORD="admin"  # Modifier si nécessaire

echo "🚀 Création des tenants via API REST..."
echo ""

# 1. Authentification pour obtenir session_id
echo "🔐 Authentification..."
AUTH_RESPONSE=$(curl -s -X POST "${API_URL}/web/session/authenticate" \
  -H "Content-Type: application/json" \
  -d "{\"jsonrpc\": \"2.0\", \"params\": {\"db\": \"${DB}\", \"login\": \"${LOGIN}\", \"password\": \"${PASSWORD}\"}}" \
  -c /tmp/odoo_cookies.txt)

# Extraire le session_id du cookie
SESSION_ID=$(grep 'session_id' /tmp/odoo_cookies.txt 2>/dev/null | awk '{print $7}')

if [ -z "$SESSION_ID" ]; then
  echo "❌ Erreur: Impossible de s'authentifier"
  echo "   Vérifiez le mot de passe admin dans le script"
  exit 1
fi

echo "✅ Authentifié (session: ${SESSION_ID:0:20}...)"
echo ""

# 2. Créer Tenant Sport
echo "📦 Création Tenant Sport (Bleu)..."
TENANT_SPORT=$(cat <<'EOF'
{
  "name": "Boutique Sport",
  "code": "sport",
  "domain": "localhost",
  "backoffice_domain": "localhost:5175",
  "slogan": "Équipement sportif de qualité",
  "primary_color": "#3b82f6",
  "primary_dark": "#2563eb",
  "primary_light": "#60a5fa",
  "secondary_color": "#10b981",
  "secondary_dark": "#059669",
  "secondary_light": "#34d399",
  "accent_color": "#f59e0b",
  "background_color": "#ffffff",
  "foreground_color": "#0f172a",
  "muted_color": "#f1f5f9",
  "muted_foreground": "#64748b",
  "border_color": "#e2e8f0",
  "ring_color": "#3b82f6",
  "email": "contact@sport.local",
  "phone": "+33 1 23 45 67 89",
  "enable_dark_mode": true,
  "feature_wishlist": true,
  "feature_comparison": true,
  "feature_reviews": true,
  "feature_newsletter": true,
  "feature_guest_checkout": true,
  "active": true
}
EOF
)

RESULT1=$(curl -s -X POST "${API_URL}/api/ecommerce/tenant/create" \
  -H "Content-Type: application/json" \
  -H "X-Session-Id: ${SESSION_ID}" \
  -d "$TENANT_SPORT")

if echo "$RESULT1" | grep -q "\"success\": true"; then
  echo "✅ Tenant Sport créé"
elif echo "$RESULT1" | grep -q "duplicate key\|DUPLICATE_KEY\|déjà utilisé"; then
  echo "⚠️  Tenant Sport existe déjà"
else
  echo "❌ Erreur: $RESULT1"
fi

echo ""

# 3. Créer Tenant Mode
echo "📦 Création Tenant Mode (Rose)..."
TENANT_MODE=$(cat <<'EOF'
{
  "name": "Marque Mode",
  "code": "mode",
  "domain": "localhost",
  "backoffice_domain": "localhost:5175",
  "slogan": "L'élégance à la française",
  "primary_color": "#ec4899",
  "primary_dark": "#db2777",
  "primary_light": "#f9a8d4",
  "secondary_color": "#8b5cf6",
  "secondary_dark": "#7c3aed",
  "secondary_light": "#a78bfa",
  "accent_color": "#f59e0b",
  "background_color": "#ffffff",
  "foreground_color": "#0f172a",
  "muted_color": "#f1f5f9",
  "muted_foreground": "#64748b",
  "border_color": "#e2e8f0",
  "ring_color": "#ec4899",
  "email": "contact@mode.local",
  "phone": "+33 1 98 76 54 32",
  "enable_dark_mode": true,
  "feature_wishlist": true,
  "feature_comparison": false,
  "feature_reviews": true,
  "feature_newsletter": true,
  "feature_guest_checkout": true,
  "active": true
}
EOF
)

RESULT2=$(curl -s -X POST "${API_URL}/api/ecommerce/tenant/create" \
  -H "Content-Type: application/json" \
  -H "X-Session-Id: ${SESSION_ID}" \
  -d "$TENANT_MODE")

if echo "$RESULT2" | grep -q "\"success\": true"; then
  echo "✅ Tenant Mode créé"
elif echo "$RESULT2" | grep -q "duplicate key\|DUPLICATE_KEY\|déjà utilisé"; then
  echo "⚠️  Tenant Mode existe déjà"
else
  echo "❌ Erreur: $RESULT2"
fi

echo ""
echo "🎉 Configuration terminée !"
echo ""
echo "🌐 Testez les frontends:"
echo "   - Tenant Sport (Bleu):  http://localhost:3000?tenant=sport"
echo "   - Tenant Mode (Rose):   http://localhost:3000?tenant=mode"
echo ""
echo "💡 Astuce: Faites Cmd+Shift+R pour vider le cache du navigateur"

# Cleanup
rm -f /tmp/odoo_cookies.txt

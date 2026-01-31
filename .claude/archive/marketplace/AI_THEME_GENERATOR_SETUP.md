# Configuration AI Theme Generator

## 🎨 Fonctionnalité Complétée

Générateur de thèmes IA via Claude API intégré dans Theme Builder.

## 📋 Composants Créés

### Frontend (dashboard-client)

**AIGeneratorModal.tsx** (`src/components/theme-builder/AIGeneratorModal.tsx`)
- Modal avec prompt textarea
- 5 exemples de prompts
- États de chargement et erreur
- Appel endpoint `/api/themes/generate`
- Intégration dans builder.tsx

**Intégration Theme Builder** (`src/pages/store/themes/builder.tsx`)
- Bouton "AI Generate" avec icône Sparkles
- State `showAIModal`
- Callback `onGenerate` pour appliquer thème généré

### Backend (odoo-backend)

**Endpoint AI** (`addons/quelyos_api/controllers/theme.py`)
- Route : `POST /api/themes/generate`
- Auth : user authentifié
- Type : jsonrpc
- Params : `{ prompt: string }`
- Retour : `{ success: bool, theme: ThemeConfig, error: string }`

**Logic Génération**
1. Récupère clé API Claude depuis `ir.config_parameter`
2. Appelle Claude API (model: claude-sonnet-4-5-20250929)
3. System prompt détaillé pour structure JSON exacte
4. Parse JSON response (nettoie markdown)
5. Retourne ThemeConfig complète

**Dependencies**
- `anthropic>=0.39.0` ajouté à `requirements.txt`
- Package installé avec `pip3 install --break-system-packages`

## ⚙️ Configuration Requise

### 1. Clé API Claude

**Créer paramètre système dans Odoo** :

```sql
-- Accéder à Odoo shell ou UI
INSERT INTO ir_config_parameter (key, value, create_uid, create_date, write_uid, write_date)
VALUES ('quelyos.claude_api_key', 'sk-ant-api03-...', 2, NOW(), 2, NOW());
```

**Ou via UI Odoo** :
1. Aller dans **Paramètres > Technique > Paramètres Système**
2. Créer nouveau paramètre :
   - Clé : `quelyos.claude_api_key`
   - Valeur : `sk-ant-api03-...` (votre clé Anthropic)

**Obtenir clé API** :
- https://console.anthropic.com/settings/keys
- Créer nouvelle clé API
- Copier et sauvegarder dans Odoo

### 2. Vérifier Installation

```bash
# Vérifier package anthropic installé
python3 -c "import anthropic; print(anthropic.__version__)"

# Redémarrer Odoo pour charger nouveau endpoint
cd odoo-backend && docker-compose restart

# Vérifier logs
docker-compose logs -f odoo | grep themes
```

## 🚀 Utilisation

### Frontend

1. Ouvrir Theme Builder : `http://localhost:5175/store/themes/builder`
2. Cliquer sur bouton **"AI Generate"** (avec icône étoiles)
3. Entrer description du thème :
   - Ex: "Thème minimaliste pour boutique de vêtements de luxe, couleurs noir et or"
4. Ou choisir un exemple de prompt prédéfini
5. Cliquer **"Générer le thème"**
6. Attendre génération (5-10 secondes)
7. Thème appliqué automatiquement dans l'éditeur

### Exemples de Prompts

```
✅ BON
- "Thème élégant pour bijouterie, couleurs pastel et rose gold"
- "Thème tech moderne pour magasin d'électronique, style futuriste"
- "Thème naturel et bio pour boutique de cosmétiques éco-responsables"

❌ TROP VAGUE
- "Un joli thème"
- "Thème e-commerce"
- "Thème moderne"
```

**Conseils** :
- Être précis : industrie, couleurs, style, ambiance
- Mentionner polices souhaitées (optionnel)
- Décrire l'audience cible

## 🔧 Troubleshooting

### Erreur : "Clé API Claude non configurée"

**Solution** : Ajouter `quelyos.claude_api_key` dans paramètres système Odoo

### Erreur : "ModuleNotFoundError: No module named 'anthropic'"

**Solution** :
```bash
pip3 install --break-system-packages 'anthropic>=0.39.0'
# Puis redémarrer Odoo
cd odoo-backend && docker-compose restart
```

### Erreur : "L'IA a retourné un format invalide"

**Solution** :
- Réessayer avec prompt plus clair
- Vérifier logs Odoo pour voir réponse brute
- Possiblement bug Claude API (réessayer dans 1 min)

### Erreur : "Erreur d'appel à l'API Claude"

**Solutions** :
1. Vérifier clé API valide
2. Vérifier quota API Anthropic
3. Vérifier connexion internet serveur Odoo
4. Vérifier logs : `docker-compose logs odoo | grep -i claude`

## 📊 Structure JSON Générée

```json
{
  "id": "ai-generated",
  "name": "Fashion Luxury",
  "category": "fashion",
  "description": "Thème élégant pour boutique de mode haut de gamme",
  "version": "1.0",
  "colors": {
    "primary": "#2c2c2c",
    "secondary": "#d4af37",
    "accent": "#ff6b6b",
    "background": "#ffffff",
    "text": "#1e293b",
    "muted": "#94a3b8"
  },
  "typography": {
    "headings": "Playfair Display",
    "body": "Lato"
  },
  "layouts": {
    "homepage": {
      "sections": [
        {
          "type": "hero-slider",
          "variant": "fullscreen-autoplay",
          "config": {}
        },
        {
          "type": "featured-products",
          "variant": "grid-4cols",
          "config": { "limit": 8 }
        },
        {
          "type": "newsletter",
          "variant": "centered",
          "config": {}
        }
      ]
    },
    "productPage": {
      "layout": "standard",
      "gallery": { "type": "standard" },
      "sections": []
    },
    "categoryPage": {
      "layout": "sidebar-left",
      "grid": "3cols",
      "filters": ["price", "category"]
    }
  },
  "components": {
    "productCard": "standard",
    "header": "standard",
    "footer": "standard",
    "buttons": "standard"
  },
  "spacing": {
    "sectionPadding": "medium",
    "containerWidth": "1280px"
  }
}
```

## 🎯 Sections Disponibles

Le system prompt limite les sections disponibles :

| Type Section | Variantes |
|--------------|-----------|
| `hero-slider` | fullscreen-autoplay, split-screen, minimal |
| `featured-products` | grid-4cols, carousel, masonry |
| `newsletter` | centered, minimal |
| `testimonials` | carousel, grid |
| `faq` | accordion, tabs |
| `trust-badges` | icons, logos |

## 💡 Améliorations Futures

### Phase Suivante (Marketplace)

- [ ] Uploader thèmes générés par IA
- [ ] Marketplace de thèmes créés par designers
- [ ] Rev-share 70/30
- [ ] Rating/Reviews
- [ ] Validation automatique thèmes

### Optimisations AI

- [ ] Analyse logo utilisateur pour extraire couleurs
- [ ] Suggestions par industrie (presets)
- [ ] Variations automatiques (générer 3 versions)
- [ ] A/B testing layouts
- [ ] Import design depuis Figma

## 📝 Notes Développeur

**Model Claude utilisé** : `claude-sonnet-4-5-20250929`
- Max tokens : 2048
- Streaming : non (réponse complète)
- Temperature : default (equilibré créativité/cohérence)

**Performance** :
- Temps moyen : 5-10 secondes
- Coût par génération : ~$0.015-0.03 (selon longueur)
- Rate limit : 50 req/min (tier standard Anthropic)

**Security** :
- Clé API stockée dans `ir.config_parameter` (accessible admin uniquement)
- Endpoint nécessite authentification user
- CSRF désactivé (API JSON-RPC)
- Validation prompt (non vide)

**Error Handling** :
- Try/catch global
- Logs détaillés (`_logger.error`)
- Messages d'erreur explicites utilisateur
- Fallback si JSON malformé

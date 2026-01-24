# 🎨 Guide: Créer un Produit avec Variants dans Odoo

## 📝 Étapes Rapides

### 1. Accéder à Odoo

Ouvrir http://localhost:8069 et se connecter:
- **Login**: admin
- **Mot de passe**: admin

### 2. Aller dans les Produits

1. Menu principal → **Inventory** (ou **Stock**)
2. Cliquer sur **Products** → **Products**

Ou directement via URL:
```
http://localhost:8069/web#action=stock.product_template_action_all&model=product.template&view_type=list
```

### 3. Créer un Nouveau Produit

1. Cliquer sur **Create** (bouton en haut à gauche)
2. Remplir les champs de base:

**Informations Générales:**
- **Product Name**: `T-Shirt Sport Premium`
- **Product Type**: `Storable Product`
- **Sales Price**: `29.99`
- **Cost**: `15.00`
- **Product Category**: Office (ou autre)

**Onglet Sales:**
- ☑️ **Can be Sold** (sale_ok)
- **Description for Quotations**: `T-shirt de sport haute qualité disponible en plusieurs couleurs et tailles`

### 4. Ajouter les Variants (Attributs)

**Onglet "Attributes & Variants":**

#### Créer l'attribut "Couleur"

1. Cliquer sur **Add a line** dans la section "Attributes"
2. Dans le popup:
   - **Attribute**: Créer nouveau → `Couleur`
   - **Display Type**: `Color`
   - **Values**: Ajouter les valeurs:
     - `Rouge` (couleur: #FF0000)
     - `Bleu` (couleur: #0000FF)
     - `Vert` (couleur: #00FF00)

#### Créer l'attribut "Taille"

1. Cliquer à nouveau sur **Add a line**
2. Dans le popup:
   - **Attribute**: Créer nouveau → `Taille`
   - **Display Type**: `Radio`
   - **Values**: Ajouter les valeurs:
     - `S`
     - `M`
     - `L`
     - `XL`

### 5. Générer les Variants

Odoo génère automatiquement **12 variants** (3 couleurs × 4 tailles):
- Rouge S, Rouge M, Rouge L, Rouge XL
- Bleu S, Bleu M, Bleu L, Bleu XL
- Vert S, Vert M, Vert L, Vert XL

Chaque variant aura un prix et un stock indépendants.

### 6. Configurer les Variants (Optionnel)

1. Aller dans l'onglet **Variants**
2. Voir la liste de tous les variants générés
3. Pour chaque variant, vous pouvez:
   - Ajuster le **prix**
   - Définir le **stock** (On Hand qty)
   - Ajouter une **image spécifique**

### 7. Rendre Visible sur le Site E-commerce

**Onglet "E-commerce" (si disponible) ou dans l'onglet Sales:**

1. ☑️ **Published** (Website Published)
2. ☑️ **Featured Product** (`is_featured`)
3. ☑️ **New Product** (`is_new`)
4. **Website Sequence**: `1` (pour l'afficher en premier)

### 8. Sauvegarder

Cliquer sur **Save** en haut

---

## 🧪 Tester via l'API

```bash
# Récupérer l'ID du produit (remplacer <ID> par l'ID du produit créé)
curl -X POST http://localhost:8069/api/ecommerce/products/<ID> \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "method": "call", "params": {}, "id": 1}' | jq
```

Vous devriez voir:
```json
{
  "result": {
    "product": {
      "id": <ID>,
      "name": "T-Shirt Sport Premium",
      "variants": [
        {
          "id": 123,
          "name": "T-Shirt Sport Premium (Rouge, S)",
          "price": 29.99,
          "in_stock": true,
          "attributes": [
            {"name": "Couleur", "value": "Rouge"},
            {"name": "Taille", "value": "S"}
          ]
        },
        // ... 11 autres variants
      ]
    }
  }
}
```

---

## 🌐 Tester sur le Frontend

1. Ouvrir http://localhost:3000/products
2. Trouver le produit "T-Shirt Sport Premium"
3. Vous devriez voir:
   - **Des boutons pour chaque variant** (Rouge, Bleu, Vert) ou (S, M, L, XL)
   - **Le prix change** quand vous cliquez sur un variant
   - **Le statut stock** (En stock / Rupture) change selon le variant

---

## 💡 Astuces

### Ajouter du Stock

1. Aller dans **Inventory** → **Products** → **Products**
2. Ouvrir le produit
3. Onglet **Inventory**
4. Cliquer sur **Update Quantity**
5. Pour chaque variant, définir la quantité

### Ajouter des Images

1. Ouvrir le produit
2. En haut à gauche, cliquer sur l'icône **Edit** de l'image
3. Uploader une image pour le produit principal
4. Pour des images spécifiques par variant:
   - Aller dans l'onglet **Variants**
   - Cliquer sur un variant
   - Uploader une image spécifique

### Modifier les Prix par Variant

1. Onglet **Variants**
2. Cliquer sur un variant
3. Modifier le champ **Sales Price**
4. Sauvegarder

---

## 📊 Exemple Complet de Configuration

```
Produit: T-Shirt Sport Premium
├── Prix de base: 29.99 €
├── Attribut 1: Couleur
│   ├── Rouge (#FF0000)
│   ├── Bleu (#0000FF)
│   └── Vert (#00FF00)
└── Attribut 2: Taille
    ├── S
    ├── M
    ├── L
    └── XL

Variants générés (12):
├── Rouge S (29.99 €) - Stock: 10
├── Rouge M (29.99 €) - Stock: 15
├── Rouge L (29.99 €) - Stock: 8
├── Rouge XL (29.99 €) - Stock: 5
├── Bleu S (29.99 €) - Stock: 12
├── Bleu M (29.99 €) - Stock: 20
├── Bleu L (29.99 €) - Stock: 10
├── Bleu XL (29.99 €) - Stock: 7
├── Vert S (31.99 €) - Stock: 0  ← Prix différent + Rupture
├── Vert M (31.99 €) - Stock: 5
├── Vert L (31.99 €) - Stock: 8
└── Vert XL (31.99 €) - Stock: 3
```

---

## 🎯 Résultat Frontend

Sur http://localhost:3000/products, vous verrez:

```
┌─────────────────────────────────────┐
│  [Image du T-Shirt]                 │
│                                     │
│  T-Shirt Sport Premium              │
│                                     │
│  [Rouge] [Bleu] [Vert]             │ ← Sélecteur variants
│  [S] [M] [L] [XL]                  │
│                                     │
│  29.99 TND                          │
│  ● En stock                         │
└─────────────────────────────────────┘
```

Quand l'utilisateur clique sur "Vert" puis "S":
- Le prix peut changer (si configuré)
- Le statut devient "Rupture de stock" (0 en stock)
- Le bouton "S" est barré

---

## ✅ Checklist de Vérification

- [ ] Produit créé dans Odoo
- [ ] Au moins 2 attributs ajoutés (Couleur, Taille)
- [ ] Variants générés automatiquement
- [ ] Stock défini pour chaque variant
- [ ] Produit publié (`sale_ok = True`)
- [ ] Marqué comme Featured/New
- [ ] API retourne les variants
- [ ] Frontend affiche les boutons de sélection
- [ ] Prix/Stock change lors du clic sur un variant

---

**Prêt à tester !** 🎉

Une fois le produit créé dans Odoo, rechargez http://localhost:3000/products
pour voir les variants s'afficher sur les cartes produits.

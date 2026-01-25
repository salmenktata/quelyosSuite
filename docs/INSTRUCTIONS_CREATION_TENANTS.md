# 🎯 Instructions Création Tenants par Défaut

## ✅ Fichiers Créés

J'ai créé les 2 tenants par défaut dans le code Odoo :

- ✅ `backend/addons/quelyos_api/data/demo_tenants_data.xml`
- ✅ Fichier ajouté au manifest (`__manifest__.py`)
- ✅ Version module incrémentée : `19.0.1.0.30`

## 🔄 Upgrade du Module Requis

Les tenants seront créés automatiquement lors de l'upgrade du module.

### Option 1 : Via Commande Skill (Recommandé)

```bash
/upgrade-odoo
```

### Option 2 : Via Interface Odoo

1. Ouvrir http://localhost:8069
2. Menu → **Apps** (Applications)
3. Rechercher **"Quelyos API"**
4. Cliquer sur **"Upgrade"** (Mettre à jour)
5. Attendre la fin du processus (~10-20 secondes)

### Option 3 : Via Ligne de Commande Docker

```bash
docker exec -it $(docker ps | grep odoo | awk '{print $1}') \
  odoo -d quelyos -u quelyos_api --stop-after-init
```

Puis redémarrer Odoo :
```bash
docker restart $(docker ps | grep odoo | awk '{print $1}')
```

### Option 4 : Via Script Quelyos

```bash
cd backend
./upgrade.sh quelyos_api
```

---

## 🎉 Après l'Upgrade

Les 2 tenants seront automatiquement créés :

### Tenant 1 - Boutique Sport
```
Code: sport
Nom: Boutique Sport
Couleurs: Bleu (#3b82f6) + Vert (#10b981)
URL: http://localhost:3000?tenant=sport
```

### Tenant 2 - Marque Mode
```
Code: mode
Nom: Marque Mode
Couleurs: Rose (#ec4899) + Violet (#8b5cf6)
URL: http://localhost:3000?tenant=mode
```

---

## 🧪 Vérification

### Vérifier dans Odoo
```
Menu → Quelyos → Tenants / Boutiques → Tous les Tenants
→ Devrait afficher 2 tenants : "Boutique Sport" et "Marque Mode"
```

### Tester les Frontends

**Vider le cache du navigateur** :
```
Cmd+Shift+R (macOS) ou Ctrl+Shift+R (Windows)
```

**Ouvrir les URLs** :
```
http://localhost:3000?tenant=sport  → Thème Bleu Sport
http://localhost:3000?tenant=mode   → Thème Rose Mode
```

---

## 🔍 Debug

### Si les tenants ne sont pas créés

**Vérifier les logs Odoo** :
```bash
# Dans les logs Docker
docker logs $(docker ps | grep odoo | awk '{print $1}') | tail -50

# Rechercher
# "Loading data from quelyos_api/data/demo_tenants_data.xml"
```

**Vérifier dans Odoo** :
```
Menu → Settings → Technical → Sequences
→ Rechercher "tenant"
```

**Forcer la création manuelle** :
```
Quelyos → Tenants / Boutiques → Créer
→ Remplir manuellement les champs selon CREATION_RAPIDE_TENANTS.md
```

---

## 📊 Données Complètes des Tenants

### Boutique Sport (Bleu)
```yaml
Identification:
  Nom: Boutique Sport
  Code: sport
  Domaine: localhost
  Slogan: Équipement sportif de qualité

Couleurs:
  Primaire: #3b82f6 (Bleu)
  Primaire Dark: #2563eb
  Primaire Light: #60a5fa
  Secondaire: #10b981 (Vert)
  Secondaire Dark: #059669
  Secondaire Light: #34d399
  Accent: #f59e0b (Orange)

Contact:
  Email: contact@sport.local
  Téléphone: +33 1 23 45 67 89

Options:
  Dark mode: ✅
  Wishlist: ✅
  Comparaison: ✅
  Avis: ✅
  Newsletter: ✅
```

### Marque Mode (Rose)
```yaml
Identification:
  Nom: Marque Mode
  Code: mode
  Domaine: localhost
  Slogan: L'élégance à la française

Couleurs:
  Primaire: #ec4899 (Rose)
  Primaire Dark: #db2777
  Primaire Light: #f9a8d4
  Secondaire: #8b5cf6 (Violet)
  Secondaire Dark: #7c3aed
  Secondaire Light: #a78bfa
  Accent: #f59e0b (Orange)

Contact:
  Email: contact@mode.local
  Téléphone: +33 1 98 76 54 32

Options:
  Dark mode: ✅
  Wishlist: ✅
  Comparaison: ❌
  Avis: ✅
  Newsletter: ✅
```

---

## 🚀 Prochaines Étapes

1. ✅ Upgrade le module : `/upgrade-odoo` ou via interface
2. ✅ Vérifier les tenants dans Odoo
3. ✅ Tester les URLs frontend
4. 🎨 Personnaliser logos, images, réseaux sociaux
5. 📦 Ajouter des produits pour chaque tenant

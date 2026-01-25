# ⚡ Création Rapide des 2 Tenants (2 minutes)

## 🎯 Tenant 1 - Sport (Bleu)

### 1. Ouvrir Odoo
```
http://localhost:8069
```

### 2. Menu
```
Quelyos → Tenants / Boutiques → Créer
```

### 3. Copier-Coller ces valeurs

**Onglet Principal** :
```
Nom boutique: Boutique Sport
Code unique: sport
Domaine principal: localhost
```

**Onglet Couleurs** (IMPORTANT) :
```
Couleur primaire: #3b82f6
Primary Dark: #2563eb
Primary Light: #60a5fa
Couleur secondaire: #10b981
Secondary Dark: #059669
Secondary Light: #34d399
Accent: #f59e0b
Background: #ffffff
Foreground: #0f172a
Muted: #f1f5f9
Muted Foreground: #64748b
Border: #e2e8f0
Ring: #3b82f6
```

### 4. Sauvegarder ✅

---

## 🎯 Tenant 2 - Mode (Rose)

### 1. Créer nouveau tenant
```
Quelyos → Tenants / Boutiques → Créer
```

### 2. Copier-Coller ces valeurs

**Onglet Principal** :
```
Nom boutique: Marque Mode
Code unique: mode
Domaine principal: localhost
Société: CRÉER NOUVELLE → "Marque Mode SAS"
```

**Onglet Couleurs** (IMPORTANT) :
```
Couleur primaire: #ec4899
Primary Dark: #db2777
Primary Light: #f9a8d4
Couleur secondaire: #8b5cf6
Secondary Dark: #7c3aed
Secondary Light: #a78bfa
Accent: #f59e0b
Background: #ffffff
Foreground: #0f172a
Muted: #f1f5f9
Muted Foreground: #64748b
Border: #e2e8f0
Ring: #ec4899
```

### 3. Sauvegarder ✅

---

## 🧪 Tester

### Vider le cache navigateur
```
Cmd+Shift+R (macOS) ou Ctrl+Shift+R (Windows/Linux)
```

### URLs à tester
```
http://localhost:3000?tenant=sport  → Bleu
http://localhost:3000?tenant=mode   → Rose
```

---

## 💡 Copier-Coller Rapide

**Pour Sport** - Cliquer dans le champ "Couleur primaire" et coller :
```
#3b82f6
```

**Pour Mode** - Cliquer dans le champ "Couleur primaire" et coller :
```
#ec4899
```

Les autres champs de couleurs peuvent être laissés vides si vous voulez aller vite !
Seule la **Couleur primaire** est obligatoire.

---

## ✅ Checklist Rapide

- [ ] Ouvrir http://localhost:8069
- [ ] Créer tenant "sport" avec couleur #3b82f6
- [ ] Créer tenant "mode" avec couleur #ec4899
- [ ] Tester http://localhost:3000?tenant=sport (bleu)
- [ ] Tester http://localhost:3000?tenant=mode (rose)

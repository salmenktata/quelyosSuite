# ⚡ UPGRADE SIMPLE - 3 Étapes

## 🎯 Objectif
Créer automatiquement les 2 tenants (Sport + Mode) en upgradant le module Odoo.

---

## Étape 1 : Ouvrir Odoo

**Aller sur** : http://localhost:8069

---

## Étape 2 : Upgrader le module

### Option A : Via le menu Apps (Recommandé)

1. Cliquer sur le **menu hamburger** (☰) en haut à gauche
2. Cliquer sur **"Apps"**
3. Dans la barre de recherche, **retirer le filtre "Apps"**
4. Taper : **"Quelyos API"**
5. Cliquer sur le bouton **"Upgrade"** (ou "Mettre à jour")
6. Attendre 10-20 secondes
7. Rafraîchir la page (F5)

### Option B : Via le menu technique (Alternative)

1. Menu → **Settings** (Paramètres)
2. En bas de page, activer le **mode développeur** si pas déjà fait
3. Menu → **Apps**
4. Retirer le filtre "Apps"
5. Rechercher "Quelyos API"
6. Cliquer "Upgrade"

---

## Étape 3 : Vérifier les tenants

### Vérifier dans Odoo

1. Menu → **Quelyos**
2. **Tenants / Boutiques**
3. **Tous les Tenants**

**Résultat attendu** :
```
✅ Boutique Sport (code: sport)
✅ Marque Mode (code: mode)
```

### Tester dans le frontend

**Vider le cache** : `Cmd+Shift+R` (macOS) ou `Ctrl+Shift+R` (Windows)

**Ouvrir** :
```
http://localhost:3000?tenant=sport
```
→ Devrait afficher des couleurs **bleues** (#3b82f6)

**Ouvrir** :
```
http://localhost:3000?tenant=mode
```
→ Devrait afficher des couleurs **roses** (#ec4899)

---

## ✅ C'est tout !

Si les 2 tenants apparaissent dans Odoo, c'est terminé ! 🎉

---

## 🔍 Debug (si ça ne marche pas)

### Si le bouton "Upgrade" n'apparaît pas

**Vérifier la version** :
1. Dans la liste des Apps, chercher "Quelyos API"
2. Vérifier que la version affichée est `19.0.1.0.30`
3. Si version différente, le module n'a pas été mis à jour

**Solution** : Redémarrer Odoo
```bash
# Si Docker
docker restart quelyos-odoo

# Si processus local
# Ctrl+C dans le terminal Odoo, puis relancer
```

### Si les tenants ne sont pas créés après l'upgrade

**Vérifier les logs Odoo** :
Rechercher dans les logs : `demo_tenants_data.xml`

**Créer manuellement** :
Si l'upgrade ne fonctionne pas, créer les tenants manuellement via :
```
Menu → Quelyos → Tenants / Boutiques → Créer
```

Puis copier-coller les valeurs depuis `CREATION_RAPIDE_TENANTS.md`

---

## 📊 Données des Tenants

### Tenant Sport (Bleu)
- Code: `sport`
- Nom: "Boutique Sport"
- Couleur primaire: `#3b82f6`
- Couleur secondaire: `#10b981`

### Tenant Mode (Rose)
- Code: `mode`
- Nom: "Marque Mode"
- Couleur primaire: `#ec4899`
- Couleur secondaire: `#8b5cf6`

---

## 💡 Console Debug (Frontend)

Ouvrir la console navigateur (F12) :

```javascript
// Vérifier le cookie tenant
document.cookie

// Vérifier la couleur CSS appliquée
getComputedStyle(document.documentElement).getPropertyValue('--primary')
// Devrait retourner: #3b82f6 (sport) ou #ec4899 (mode)
```

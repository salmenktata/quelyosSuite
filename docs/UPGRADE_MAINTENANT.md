# ⚡ UPGRADE MODULE MAINTENANT

## 🎯 Objectif

Upgrader le module `quelyos_api` pour créer automatiquement les 2 tenants :
- **Boutique Sport** (code: `sport`, couleur: bleu)
- **Marque Mode** (code: `mode`, couleur: rose)

---

## 🚀 Méthode Simple (2 minutes)

### 1. Ouvrir l'interface Odoo
```
http://localhost:8069
```

### 2. Aller dans Apps
```
Menu en haut à gauche → Apps
```

### 3. Retirer le filtre "Apps"
Dans la barre de recherche, **supprimer** le filtre qui dit "Apps" pour voir **tous** les modules.

### 4. Rechercher "Quelyos API"
Taper dans la recherche : `Quelyos API`

### 5. Cliquer sur "Upgrade" (Mettre à jour)
Vous devriez voir le module avec un bouton **"Upgrade"** ou **"Mettre à jour"**.

Cliquez dessus et attendez ~10-20 secondes.

### 6. Rafraîchir la page
Une fois l'upgrade terminé, rafraîchir la page Odoo (F5).

---

## ✅ Vérification

### Vérifier que les tenants sont créés

```
Menu → Quelyos → Tenants / Boutiques → Tous les Tenants
```

Vous devriez voir **2 tenants** :
- ✅ Boutique Sport (code: sport)
- ✅ Marque Mode (code: mode)

---

## 🧪 Tester les Frontends

### Vider le cache du navigateur
```
Cmd+Shift+R (macOS) ou Ctrl+Shift+R (Windows)
```

### Ouvrir les URLs

**Boutique Sport (Bleu)** :
```
http://localhost:3000?tenant=sport
```
→ Devrait afficher des boutons/liens **bleus** (#3b82f6)

**Marque Mode (Rose)** :
```
http://localhost:3000?tenant=mode
```
→ Devrait afficher des boutons/liens **roses** (#ec4899)

---

## 🔍 Debug Console

Pour vérifier que le tenant est bien chargé, ouvrez la console navigateur (F12) :

```javascript
// Vérifier le cookie
document.cookie
// Devrait contenir: tenant_code=sport ou tenant_code=mode

// Vérifier les variables CSS appliquées
getComputedStyle(document.documentElement).getPropertyValue('--primary')
// Devrait retourner: #3b82f6 (sport) ou #ec4899 (mode)
```

---

## ⚠️ Si l'upgrade ne fonctionne pas

### Option Alternative : Redémarrer Odoo

Si le bouton "Upgrade" n'apparaît pas, redémarrez Odoo :

**Via Docker** (si vous utilisez Docker) :
```bash
docker restart quelyos-odoo
```

**Via Processus** (si Odoo tourne en local) :
```bash
# Arrêter Odoo (Ctrl+C dans le terminal)
# Puis relancer
cd backend
./odoo-bin -c odoo.conf
```

Puis retentez l'upgrade via Apps.

---

## 📋 Checklist Rapide

- [ ] Ouvrir http://localhost:8069
- [ ] Menu → Apps
- [ ] Rechercher "Quelyos API"
- [ ] Cliquer "Upgrade"
- [ ] Attendre 10-20 secondes
- [ ] Vérifier : Menu → Quelyos → Tenants → 2 tenants présents
- [ ] Tester : http://localhost:3000?tenant=sport (bleu)
- [ ] Tester : http://localhost:3000?tenant=mode (rose)

---

## 🎉 Résultat Attendu

Après l'upgrade, vous aurez :

### Tenant Sport (Bleu)
- Code: `sport`
- Nom: "Boutique Sport"
- Couleur primaire: #3b82f6 (Bleu)
- Couleur secondaire: #10b981 (Vert)
- URL: http://localhost:3000?tenant=sport

### Tenant Mode (Rose)
- Code: `mode`
- Nom: "Marque Mode"
- Couleur primaire: #ec4899 (Rose)
- Couleur secondaire: #8b5cf6 (Violet)
- URL: http://localhost:3000?tenant=mode

---

## 💡 Aide

Si vous rencontrez des problèmes, vérifiez :

1. **Odoo est démarré** : http://localhost:8069 accessible
2. **Version du module** : Devrait être `19.0.1.0.30`
3. **Logs Odoo** : Rechercher "demo_tenants_data.xml" dans les logs

Pour voir les logs :
```bash
# Si Docker
docker logs quelyos-odoo | grep "demo_tenants"

# Si processus local
# Consulter le terminal où Odoo tourne
```

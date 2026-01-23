# ⚡ Démarrage Rapide - Quelyos ERP

Ce guide vous permet de démarrer le projet en 5 minutes.

## 🎯 Objectif

Avoir un système e-commerce complet fonctionnel:
- ✅ Backend Odoo avec API REST
- ✅ Frontend Next.js connecté
- ✅ Branding Quelyos appliqué
- ✅ Modules e-commerce installés

## 🚀 En 3 étapes

### Étape 1: Démarrer Odoo (2 min)

```bash
cd backend
docker-compose up -d
```

**Vérification:** Accéder à http://localhost:8069
- Login: `admin`
- Password: `admin`

### Étape 2: Installer les Modules (2 min)

Dans l'interface Odoo:

1. Cliquer sur **Apps** (menu principal)
2. Cliquer sur **Update Apps List**
3. Rechercher "Quelyos"
4. Installer dans l'ordre:
   - **Quelyos Branding** (cliquer Install)
   - **Quelyos E-commerce API** (cliquer Install)

**Vérification:** Menu "E-commerce" apparaît dans la sidebar

### Étape 3: Démarrer Frontend (1 min)

```bash
cd frontend
npm install  # Seulement la première fois
npm run dev
```

**Vérification:** Accéder à http://localhost:3000

## ✅ C'est Tout!

Vous avez maintenant:
- 🎨 Interface Odoo personnalisée (branding Quelyos)
- 🛒 Module e-commerce complet installé
- 💻 Frontend Next.js prêt à connecter

## 🎓 Prochaines Étapes

### 1. Créer un Produit de Test

**Backend Odoo:**
1. Aller dans **E-commerce → Catalogue → Produits**
2. Cliquer **Créer**
3. Remplir:
   - Nom: "T-Shirt Quelyos"
   - Prix: 29.99
   - Onglet **E-commerce**: cocher "Produit mis en avant"
4. Enregistrer

**Le produit sera automatiquement disponible sur le frontend!**

### 2. Créer un Coupon

**Backend Odoo:**
1. **E-commerce → Marketing → Coupons**
2. Créer:
   - Code: `WELCOME10`
   - Type: Pourcentage
   - Valeur: 10%
3. Enregistrer

### 3. Tester le Panier

**Frontend (http://localhost:3000):**
1. Parcourir les produits
2. Ajouter au panier
3. Appliquer le coupon `WELCOME10`
4. Procéder au checkout

## 📚 Documentation Complète

- [README.md](./README.md) - Documentation complète
- [TESTING.md](./TESTING.md) - Guide de tests
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Déploiement production

## 🛠️ Commandes Utiles

```bash
# Redémarrer Odoo
cd backend && docker-compose restart odoo

# Voir logs Odoo
cd backend && docker-compose logs -f odoo

# Redémarrer Frontend
cd frontend && npm run dev

# Tests Frontend
cd frontend && npm run test
```

## 🐛 Problèmes Fréquents

### Module non visible
```bash
cd backend
docker-compose exec odoo odoo -d quelyos -u quelyos_ecommerce --stop-after-init
docker-compose restart odoo
```

### Frontend ne se connecte pas
Vérifier `.env.local`:
```bash
NEXT_PUBLIC_ODOO_URL=http://localhost:8069
```

### Port déjà utilisé
```bash
# Changer le port Odoo dans docker-compose.yml
ports:
  - "8070:8069"  # Au lieu de 8069:8069
```

## 💡 Conseils

1. **Premier lancement:** Attendre 30 secondes que Odoo initialise la base
2. **Performance:** Docker Desktop allouer au moins 4GB RAM
3. **Développement:** Utiliser Chrome DevTools pour déboguer le frontend

## 🎉 Prêt à Développer!

Vous êtes prêt à développer votre boutique e-commerce!

**Ressources:**
- API Documentation: Voir [README.md#api-e-commerce](./README.md#-api-e-commerce)
- Architecture: Voir [README.md#architecture](./README.md#architecture)
- Support: support@quelyos.com

---

**Temps total:** 5 minutes ⏱️ | **Difficulté:** Facile 🟢

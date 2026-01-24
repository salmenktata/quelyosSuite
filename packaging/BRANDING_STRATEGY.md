# Stratégie de Branding Quelyos ERP

## Objectif

Supprimer **toutes les mentions visibles d'Odoo** pour l'utilisateur final, tout en conservant les références techniques nécessaires au fonctionnement du système.

## Règles de Branding

### ✅ À MODIFIER (Visible par l'utilisateur)

1. **Interfaces utilisateur** (Frontend, Backoffice)
   - Messages d'erreur contenant "Odoo"
   - Tooltips et aides contextuelles
   - Titres de pages et sections
   - Descriptions de fonctionnalités
   - Documentation utilisateur

2. **Configuration et fichiers publics**
   - `package.json` : description, nom
   - `README.md` : mentions Odoo en tant que produit
   - Fichiers de configuration exposés à l'utilisateur
   - Variables d'environnement visibles

3. **Assets et branding**
   - Logos
   - Favicons
   - Images de marque
   - Métadonnées SEO

### ❌ À CONSERVER (Technique uniquement)

1. **Code technique**
   - Noms de variables : `odooClient`, `odoo.ts`, `odooRpc`
   - Noms de fonctions internes
   - Commentaires de code expliquant l'implémentation Odoo
   - Tests unitaires

2. **Backend**
   - Tous les fichiers dans `backend/` (c'est Odoo lui-même)
   - Modules Odoo (`addons/`)
   - Configuration Odoo (`odoo.conf`)

3. **API et intégrations**
   - Routes `/api/odoo/*` (URLs techniques)
   - Endpoints backend Odoo
   - Paramètres de connexion Odoo

## Plan d'Action

### Phase 1 : Branding Frontend (Priorité Haute)

**Fichiers à modifier :**

1. `frontend/src/lib/config/branding.ts`
   ```typescript
   export const BRAND = {
     name: 'Quelyos',
     tagline: 'Votre Solution E-commerce',
     // Remplacer toutes références Odoo
   }
   ```

2. `frontend/src/lib/config/site.ts`
   - Mettre à jour métadonnées : title, description

3. `frontend/next.config.ts`
   - Vérifier les commentaires et descriptions

4. Messages utilisateur dans :
   - `frontend/src/components/` (tous les composants UI)
   - `frontend/src/app/` (toutes les pages)

### Phase 2 : Branding Backoffice (Priorité Haute)

**Fichiers à modifier :**

1. `backoffice/index.html`
   - Title : "Quelyos ERP - Backoffice"

2. `backoffice/package.json`
   - name : "quelyos-backoffice"
   - description : sans mention Odoo

3. `backoffice/src/pages/Dashboard.tsx`
   - Textes d'accueil, descriptions

4. `backoffice/src/components/Layout.tsx`
   - Logo, titre application

### Phase 3 : Documentation et Assets (Priorité Moyenne)

1. **README.md principal**
   - Remplacer "Odoo 19 Community" par "Backend robuste"
   - Conserver mentions légales LGPL v3

2. **Images et logos**
   - Créer logo Quelyos
   - Remplacer favicons
   - Générer splash screens

3. **Documentation utilisateur**
   - Guides d'utilisation
   - FAQ
   - Tutoriels vidéo

### Phase 4 : Légal et Conformité (Obligatoire)

1. **Mentions légales**
   - Créer page `/legal` avec :
     - Licence Quelyos (Frontend/Backoffice : Propriétaire)
     - Attribution Odoo Community (Backend : LGPL v3)
     - Texte type :
       ```
       Quelyos ERP utilise Odoo Community Edition (LGPL v3) comme backend.
       Odoo est une marque déposée d'Odoo S.A.
       L'interface utilisateur Quelyos est propriétaire et non affiliée à Odoo S.A.
       ```

2. **Fichier LICENSE**
   - Frontend/Backoffice : Licence propriétaire
   - Backend/API : LGPL v3 (conservé)

## Checklist de Validation

### Visible par l'utilisateur final

- [ ] Page d'accueil boutique : aucune mention Odoo
- [ ] Page de connexion backoffice : aucune mention Odoo
- [ ] Dashboard admin : aucune mention Odoo
- [ ] Messages d'erreur : aucune mention Odoo
- [ ] Emails envoyés : aucune mention Odoo
- [ ] Factures PDF : aucune mention Odoo
- [ ] Favicon/Logo : branding Quelyos

### SEO et Métadonnées

- [ ] Title tags : "Quelyos ERP"
- [ ] Meta descriptions : sans mention Odoo
- [ ] Open Graph : images et textes Quelyos
- [ ] Sitemap : URLs Quelyos

### Légal

- [ ] Page /legal créée avec attributions correctes
- [ ] License fichiers respectées (LGPL v3 pour backend)
- [ ] Conformité utilisation marque Odoo

## Commandes Utiles

### Rechercher mentions Odoo visibles

```bash
# Frontend - textes utilisateur
grep -r "Odoo" frontend/src/app/ frontend/src/components/ --include="*.tsx" --include="*.ts"

# Backoffice - UI
grep -r "Odoo" backoffice/src/pages/ backoffice/src/components/ --include="*.tsx" --include="*.ts"

# Configuration
grep -r "Odoo" */package.json */README.md
```

### Remplacements sûrs

```bash
# Descriptions package.json
sed -i 's/Odoo 19/Backend ERP/g' */package.json

# Commentaires utilisateur (pas code)
# À faire manuellement pour éviter de casser le code
```

## Résultat Attendu

**Après le branding complet :**

1. ✅ L'utilisateur final ne voit **JAMAIS** le mot "Odoo"
2. ✅ Le code technique continue de fonctionner (variables `odoo*` conservées)
3. ✅ La conformité légale est respectée (page /legal avec attributions)
4. ✅ Le SEO et les métadonnées sont cohérents avec "Quelyos ERP"
5. ✅ Les emails et documents générés portent la marque Quelyos

## Notes Importantes

- **Ne pas modifier** : `backend/` (c'est Odoo lui-même)
- **Ne pas modifier** : Noms de variables techniques dans le code
- **Toujours vérifier** : Les changements ne cassent pas les fonctionnalités
- **Respecter** : La licence LGPL v3 d'Odoo Community (attributions obligatoires)

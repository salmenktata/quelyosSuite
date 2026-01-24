# Attributions et Licences Open Source
## Quelyos ERP

Ce projet utilise plusieurs bibliothèques et frameworks open source. Nous remercions chaleureusement leurs auteurs et contributeurs.

**Dernière mise à jour** : [Date]

---

## Odoo Community Edition

**Licence** : LGPL v3
**Auteur** : Odoo S.A.
**Site web** : https://www.odoo.com
**Dépôt GitHub** : https://github.com/odoo/odoo
**Version utilisée** : 19.0

Odoo Community Edition est le cœur de Quelyos ERP. Nous utilisons uniquement la version Community (LGPL v3) et ne revendiquons aucun droit sur le code d'Odoo.

**Licence complète** : https://github.com/odoo/odoo/blob/19.0/LICENSE

---

## Frontend (Next.js)

### Framework Principal

**Next.js**
- Licence : MIT
- Auteur : Vercel
- Site web : https://nextjs.org
- Version : 16.x

**React**
- Licence : MIT
- Auteur : Meta (Facebook)
- Site web : https://react.dev
- Version : 19.x

### Styling

**Tailwind CSS**
- Licence : MIT
- Auteur : Tailwind Labs
- Site web : https://tailwindcss.com

**@headlessui/react**
- Licence : MIT
- Auteur : Tailwind Labs
- Usage : Composants UI accessibles

**@heroicons/react**
- Licence : MIT
- Auteur : Tailwind Labs
- Usage : Icônes SVG

### State Management

**Zustand**
- Licence : MIT
- Auteur : Poimandres
- Site web : https://github.com/pmndrs/zustand
- Usage : State management léger

### Formulaires et Validation

**React Hook Form**
- Licence : MIT
- Site web : https://react-hook-form.com
- Usage : Gestion formulaires

**Zod**
- Licence : MIT
- Auteur : Colin McDonnell
- Site web : https://zod.dev
- Usage : Validation schémas TypeScript

### Client HTTP

**Axios**
- Licence : MIT
- Site web : https://axios-http.com

### Autres dépendances frontend

Pour la liste complète : voir `frontend/package.json`

Génération automatique :
```bash
cd frontend && npm list --all > ../ATTRIBUTIONS_FRONTEND.txt
```

---

## Backoffice (React + Vite)

### Framework et Bundler

**Vite**
- Licence : MIT
- Auteur : Evan You
- Site web : https://vitejs.dev

**React**
- Licence : MIT (voir section Frontend)

**React Router**
- Licence : MIT
- Site web : https://reactrouter.com
- Usage : Routing

### UI et Styling

**Tailwind CSS** (voir section Frontend)

**Lucide React**
- Licence : ISC
- Site web : https://lucide.dev
- Usage : Icônes modernes

### Data Fetching

**TanStack React Query** (anciennement React Query)
- Licence : MIT
- Auteur : Tanner Linsley
- Site web : https://tanstack.com/query
- Usage : Cache et synchronisation données serveur

### Notifications

**Sonner**
- Licence : MIT
- Auteur : Emil Kowalski
- Site web : https://sonner.emilkowal.ski
- Usage : Toasts/notifications modernes

### Autres dépendances backoffice

Pour la liste complète : voir `backoffice/package.json`

Génération automatique :
```bash
cd backoffice && npm list --all > ../ATTRIBUTIONS_BACKOFFICE.txt
```

---

## Backend (Odoo + Module API)

### Python et Framework Odoo

**Python**
- Licence : PSF License (Python Software Foundation)
- Version : 3.12

**Odoo Community Edition** (voir section dédiée ci-dessus)

### Dépendances Python

**Werkzeug**
- Licence : BSD-3-Clause
- Usage : Serveur WSGI (utilisé par Odoo)

**psycopg2**
- Licence : LGPL v3
- Usage : Driver PostgreSQL

**Passlib**
- Licence : BSD
- Usage : Hachage mots de passe

**Pillow**
- Licence : HPND (Historical Permission Notice and Disclaimer)
- Usage : Manipulation images

**lxml**
- Licence : BSD
- Usage : Parsing XML

Pour la liste complète : voir `backend/requirements.txt` ou dépendances Odoo officielles.

---

## Infrastructure et DevOps

### Conteneurisation

**Docker**
- Licence : Apache 2.0
- Site web : https://www.docker.com

**Docker Compose**
- Licence : Apache 2.0

### Base de Données

**PostgreSQL**
- Licence : PostgreSQL License (similaire BSD/MIT)
- Version : 15.x
- Site web : https://www.postgresql.org

### Serveur Web

**Nginx**
- Licence : BSD-2-Clause
- Site web : https://nginx.org

### Monitoring (optionnel)

**Prometheus**
- Licence : Apache 2.0
- Site web : https://prometheus.io

**Grafana**
- Licence : AGPL v3
- Site web : https://grafana.com

**Loki**
- Licence : AGPL v3
- Auteur : Grafana Labs

---

## Services Tiers (SaaS)

Ces services ne sont pas inclus dans le code source mais sont utilisés en production :

### Paiement

**Stripe**
- Site web : https://stripe.com
- Usage : Traitement des paiements CB
- Politique de confidentialité : https://stripe.com/privacy

### Analytics

**Google Analytics**
- Auteur : Google LLC
- Site web : https://analytics.google.com
- Usage : Statistiques de visite (avec IP anonymisée)
- Politique de confidentialité : https://policies.google.com/privacy

### Email

**Mailchimp** (optionnel)
- Auteur : Intuit
- Site web : https://mailchimp.com
- Usage : Newsletters
- Politique de confidentialité : https://www.intuit.com/privacy/statement/

---

## Outils de Développement

### TypeScript

**TypeScript**
- Licence : Apache 2.0
- Auteur : Microsoft
- Site web : https://www.typescriptlang.org

### ESLint

**ESLint**
- Licence : MIT
- Site web : https://eslint.org
- Usage : Linting JavaScript/TypeScript

### Prettier

**Prettier**
- Licence : MIT
- Site web : https://prettier.io
- Usage : Formatage code

### Playwright (tests E2E)

**Playwright**
- Licence : Apache 2.0
- Auteur : Microsoft
- Site web : https://playwright.dev

---

## Fonts et Icônes

### Polices de caractères

**Inter**
- Licence : SIL Open Font License 1.1
- Auteur : Rasmus Andersson
- Site web : https://rsms.me/inter/

### Icônes

**Heroicons**
- Licence : MIT
- Auteur : Tailwind Labs
- Site web : https://heroicons.com

**Lucide**
- Licence : ISC
- Site web : https://lucide.dev

---

## Images et Illustrations

Si des images ou illustrations tierces sont utilisées, elles seront listées ici avec leurs crédits et licences respectives.

**À compléter selon l'utilisation réelle.**

---

## Licences de ce Projet

Quelyos ERP utilise une **licence mixte** :

1. **Code propriétaire** (Frontend + Backoffice) : Tous droits réservés Quelyos
   - Voir `LICENSE`, `frontend/LICENSE`, `backoffice/LICENSE`

2. **Code open source** (Module API Odoo) : LGPL v3
   - Voir `backend/addons/quelyos_api/LICENSE`

---

## Génération Automatique des Dépendances

### Frontend

```bash
cd frontend
npm list --all > ../ATTRIBUTIONS_FRONTEND.txt
npx license-checker --json > ../ATTRIBUTIONS_FRONTEND_LICENSES.json
```

### Backoffice

```bash
cd backoffice
npm list --all > ../ATTRIBUTIONS_BACKOFFICE.txt
npx license-checker --json > ../ATTRIBUTIONS_BACKOFFICE_LICENSES.json
```

### Backend (Python)

```bash
cd backend
pip list --format=freeze > requirements_freeze.txt
pip-licenses --format=markdown --output-file=../ATTRIBUTIONS_BACKEND_LICENSES.md
```

---

## Remerciements

Nous remercions l'ensemble de la communauté open source pour leur travail formidable.

Sans ces projets, Quelyos ERP n'existerait pas.

**Mentions spéciales** :
- **Odoo S.A.** pour Odoo Community Edition
- **Vercel** pour Next.js
- **Meta** pour React
- **Tailwind Labs** pour Tailwind CSS et ses outils
- **Tous les contributeurs** des milliers de packages npm et Python utilisés

---

## Mise à Jour

Ce fichier est mis à jour à chaque ajout de dépendance majeure.

Pour signaler une erreur ou une omission : legal@quelyos.com

---

**Version** : 1.0
**Date** : [Date]

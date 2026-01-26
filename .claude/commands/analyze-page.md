# Commande /analyze-page - Analyse de Page et Plan d'Administration

Tu es un analyste frontend/backoffice pour Quelyos ERP. Ta mission est d'analyser une page spécifique du site et d'identifier toutes les données qui pourraient être administrables depuis le backoffice.

## Objectif

Effectuer une analyse complète d'une page pour identifier :
1. Les données actuellement affichées (dynamiques vs statiques)
2. Ce qui est déjà administrable depuis le backoffice
3. Ce qui pourrait/devrait être administrable
4. Un plan d'action pour rendre la page 100% administrable

## Paramètre requis

$ARGUMENTS

Le paramètre doit être une URL ou un chemin de page du frontend Next.js.

Exemples :
- `/analyze-page /products` - Page catalogue produits
- `/analyze-page /` - Page d'accueil
- `/analyze-page /cart` - Page panier
- `/analyze-page /checkout` - Page checkout
- `/analyze-page http://localhost:3000/categories` - URL complète

## Procédure d'analyse

### Phase 1 : Exploration du code frontend

1. **Identifier le fichier page** dans `vitrine-quelyos/app/` ou `vitrine-client/app/`
   - Trouver le fichier `page.tsx` correspondant à la route
   - Identifier les composants importés

2. **Analyser les composants utilisés**
   - Lister tous les composants de la page
   - Pour chaque composant, identifier les props et données attendues

3. **Tracer les sources de données**
   - Appels API (odooClient, fetch, etc.)
   - Stores Zustand/Context
   - Données hardcodées dans le code

### Phase 2 : Inventaire des éléments visuels

Créer un inventaire exhaustif :

| Élément | Type | Source | Administrable ? |
|---------|------|--------|-----------------|
| Titre page | Texte | Hardcodé | Non |
| Liste produits | Données | API | Oui |
| Options tri | Config | Hardcodé | Non (à faire) |
| ... | ... | ... | ... |

Catégories de types :
- **Texte** : Labels, titres, descriptions
- **Données** : Listes, détails, prix
- **Config** : Options, filtres, paramètres
- **UI** : Couleurs, images, animations
- **Layout** : Structure, ordre des sections

### Phase 3 : Analyse du backoffice

Vérifier dans `dashboard-client/src/pages/` :
- Quelles pages/formulaires existent pour ce module ?
- Quels champs sont éditables ?
- Que manque-t-il ?

### Phase 4 : Analyse de l'API Odoo

Vérifier dans `odoo-odoo-backend/addons/quelyos_api/controllers/` :
- Quels endpoints existent ?
- Quels champs sont exposés ?
- Quels champs manquent ?

### Phase 5 : Génération du rapport

## Format de sortie

```markdown
## Analyse de Page : [URL/Route] - [Date]

### Résumé
- Total éléments analysés : X
- Déjà administrables : X (X%)
- À rendre administrables : X (X%)
- Hardcodés (à conserver) : X (X%)

### Éléments par catégorie

#### Données produits/entités
| Donnée | Affichée | API | Backoffice | Action |
|--------|----------|-----|------------|--------|
| Nom | ✅ | ✅ | ✅ | - |
| is_featured | ✅ | ❌ | ❌ | Ajouter |
| ... | ... | ... | ... | ... |

#### Configuration page
| Config | Actuel | Administrable | Action |
|--------|--------|---------------|--------|
| Options tri | Hardcodé | Non | Ajouter dans SiteConfig |
| Pagination | Hardcodé | Non | Ajouter dans SiteConfig |
| ... | ... | ... | ... |

#### Textes/Labels
| Texte | Valeur actuelle | Administrable | Recommandation |
|-------|-----------------|---------------|----------------|
| "Filtrer" | Statique | Non | i18n ou SiteConfig |
| ... | ... | ... | ... |

### Plan d'action

#### Priorité 1 - Backend Odoo
1. [ ] Ajouter champ X au modèle
2. [ ] Exposer champ Y dans l'API
...

#### Priorité 2 - Backoffice
1. [ ] Ajouter champ X dans ProductForm
2. [ ] Créer section Y dans SiteConfig
...

#### Priorité 3 - Frontend (optionnel)
1. [ ] Adapter composant X pour lire config
...

### Fichiers à modifier

| Fichier | Modifications |
|---------|--------------|
| `odoo-odoo-backend/.../main.py` | Ajouter champs X, Y |
| `dashboard-client/.../ProductForm.tsx` | UI pour X, Y |
| ... | ... |

### Estimation effort
- Backend : X modifications
- Backoffice : X modifications
- Frontend : X modifications (optionnel)
```

## Règles importantes

- **TOUJOURS** commencer par lire le code avant de proposer des modifications
- **IDENTIFIER** clairement ce qui est déjà en place vs ce qui manque
- **PRIORISER** par impact utilisateur (admin backoffice)
- **NE JAMAIS** proposer de modifier le schéma DB Odoo sans alerter
- **DOCUMENTER** les dépendances entre modifications

## Exemple d'exécution

```
/analyze-page /products
```

Lance une analyse complète de la page catalogue produits.

```
/analyze-page /checkout/shipping
```

Lance une analyse de la page de sélection de livraison.

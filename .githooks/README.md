# Git Hooks - Quelyos ERP

Ce dossier contient des Git hooks personnalisés pour automatiser les vérifications lors du développement.

## Installation

Les hooks sont automatiquement configurés si vous clonez ce dépôt. Si ce n'est pas le cas :

```bash
git config core.hooksPath .githooks
```

## Hooks Disponibles

### pre-commit

**Objectif** : Garantir la qualité du code en vérifiant automatiquement les modifications critiques.

**Ce qu'il vérifie** :

#### 1. Modifications des modèles Odoo
- ✅ Si des fichiers dans `backend/addons/*/models/*.py` ont été modifiés
- ✅ Si `__manifest__.py` a été modifié en conséquence
- ✅ Si la version dans `__manifest__.py` a été incrémentée

#### 2. Dark Mode (Backoffice)
- ✅ Si les fichiers modifiés dans `backoffice/src/pages/*.tsx` et `backoffice/src/components/*.tsx`
- ✅ Si toutes les classes `bg-white` ont une variante `dark:bg-gray-*`
- ✅ Conformité aux standards du dark mode (voir `backoffice/DARK_MODE.md`)

**En cas de problème** :
Le commit sera **bloqué** avec un message explicatif.

**Bypass (non recommandé)** :
```bash
git commit --no-verify
```

## Workflows Recommandés

### Modifications de modèles Odoo

1. **Modifier le code** : Ajouter/modifier des champs dans `models/*.py`

2. **Incrémenter la version** : Éditer `__manifest__.py`
   ```python
   'version': '19.0.1.0.1',  # Incrémenter
   ```

3. **Commiter** :
   ```bash
   git add backend/addons/quelyos_api/models/mon_fichier.py
   git add backend/addons/quelyos_api/__manifest__.py
   git commit -m "feat: add new field to model"
   ```
   Le hook pré-commit vérifiera que tout est en ordre.

4. **Upgrader le module** :
   ```bash
   cd backend && ./upgrade.sh quelyos_api
   ```

5. **Tester** :
   ```bash
   # Vérifier que les champs existent bien en DB
   ./backend/check_fields.sh backend/addons/quelyos_api/models/stock_quant.py product_template
   ```

### Modifications du Backoffice (Dark Mode)

Quand vous modifiez une page ou un composant :

1. **Modifier le code** : Ajouter/modifier des composants dans `backoffice/src/`

2. **Vérifier le dark mode** :
   ```bash
   cd backoffice && ./scripts/check-dark-mode.sh
   ```

3. **Règles à respecter** :
   - Toute classe `bg-white` doit avoir `dark:bg-gray-800`
   - Toute classe `bg-gray-50` doit avoir `dark:bg-gray-900`
   - Les bordures doivent avoir des variantes dark
   - Les textes doivent avoir des variantes dark
   - Voir `backoffice/DARK_MODE.md` pour la palette complète

4. **Tester visuellement** :
   - Tester la page en mode clair
   - Basculer en mode sombre (bouton dans le sidebar)
   - Vérifier qu'aucun fond blanc ne persiste

5. **Commiter** :
   ```bash
   git add backoffice/src/pages/MaPage.tsx
   git commit -m "feat: add new feature to backoffice"
   ```
   Le hook pré-commit vérifiera automatiquement le dark mode.

## Maintenance

Pour désactiver temporairement les hooks :
```bash
git config core.hooksPath ""
```

Pour les réactiver :
```bash
git config core.hooksPath .githooks
```

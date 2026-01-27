# 🔍 Script d'Audit UI/UX Automatique

Script shell pour auditer et corriger automatiquement les non-conformités UI/UX sur toutes les pages du dashboard Quelyos ERP selon la charte à 120 points.

## 📋 Checklist des 5 Critères CRITIQUES

Le script vérifie automatiquement :

1. ✅ **Breadcrumbs** - Navigation présente en haut de page
2. ✅ **PageNotice** - Guide contextuel après le header
3. ✅ **lucide-react** - Pas d'heroicons (@heroicons/react)
4. ✅ **Button component** - Pas de boutons manuels `<button>`
5. ✅ **SkeletonTable** - Pas de spinners custom pour le loading

## 🚀 Utilisation

### Auditer un module spécifique

```bash
# Audit simple (lecture seule)
./scripts/uiux-audit.sh store

# Audit avec corrections automatiques
./scripts/uiux-audit.sh --fix store
```

### Auditer tous les modules

```bash
# Audit de tous les modules
./scripts/uiux-audit.sh --all

# Audit et correction de tout
./scripts/uiux-audit.sh --fix --all
```

### Modules disponibles

- `finance` - Module Finance
- `store` - Module Boutique
- `stock` - Module Stock
- `crm` - Module CRM
- `marketing` - Module Marketing
- `hr` - Module RH

## 📊 Rapport Généré

Le script génère un rapport Markdown dans `docs/uiux-reports/` :

```
docs/uiux-reports/
├── store_audit_20260127_143022.md
├── finance_audit_20260127_143145.md
└── ...
```

### Format du rapport

```markdown
# Rapport d'Audit UI/UX - Module store

**Date**: 2026-01-27 14:30:22

| Fichier | Score | Problèmes |
|---------|-------|-----------|
| MyShop.tsx | 5/5 ✅ | Aucun |
| Products.tsx | 5/5 ✅ | Aucun |
| Orders.tsx | 4/5 ⚠️ | Heroicons détecté |
| OrderDetail.tsx | 2/5 ❌ | Breadcrumbs manquant, PageNotice manquant |

═══════════════════════════════════════════════════════════════
📊 Résumé du module store
═══════════════════════════════════════════════════════════════
Total fichiers audités: 21
Score moyen: 88/105 (84%)
Fichiers parfaits (5/5): 9
Fichiers critiques (<3/5): 1
```

## 🔧 Mode Correction

Avec l'option `--fix`, le script :

1. ✅ Crée un backup `.bak` de chaque fichier modifié
2. ⚠️ Identifie les corrections nécessaires
3. 🛠️ Applique les corrections automatiques possibles
4. 📝 Liste les corrections manuelles requises

### Corrections automatiques

- ✅ Migration heroicons → lucide-react (détection)
- ⚠️ Ajout Breadcrumbs (nécessite intervention manuelle pour le nom)
- ⚠️ Ajout PageNotice (nécessite intervention manuelle pour la config)
- ⚠️ Remplacement boutons (complexe, recommandation manuelle)
- ⚠️ Remplacement spinners (recommandation manuelle)

### Restaurer les backups

Si besoin de restaurer les fichiers originaux :

```bash
# Voir les backups
find dashboard-client/src/pages -name '*.bak'

# Restaurer tous les backups
find dashboard-client/src/pages -name '*.bak' -exec bash -c 'mv "$1" "${1%.bak}"' _ {} \;

# Supprimer tous les backups
find dashboard-client/src/pages -name '*.bak' -delete
```

## 📈 Scores et Grades

| Score | Grade | Signification |
|-------|-------|---------------|
| 5/5 | ✅ S+ | Parfait - 100% conforme |
| 4/5 | ⚠️ A | Bon - corrections mineures |
| 3/5 | ⚠️ B | Acceptable - corrections recommandées |
| <3/5 | ❌ C | Critique - corrections urgentes |

## 🎯 Workflow Recommandé

### 1. Audit Initial

```bash
./scripts/uiux-audit.sh --all
```

Examinez les rapports générés dans `docs/uiux-reports/`.

### 2. Corrections Prioritaires

Corrigez d'abord les pages critiques (<3/5) :

```bash
# Identifier les pages critiques
grep "❌" docs/uiux-reports/store_audit_*.md

# Corriger manuellement les pages identifiées
# Utiliser Claude Code avec /uiux --fix [fichier]
```

### 3. Corrections Automatiques

```bash
./scripts/uiux-audit.sh --fix store
```

### 4. Vérification Post-Correction

```bash
./scripts/uiux-audit.sh store
```

Comparez le nouveau score avec le précédent.

## 🔍 Intégration CI/CD

Le script peut être intégré dans un pipeline CI/CD :

```yaml
# .github/workflows/uiux-audit.yml
name: UI/UX Audit

on: [push, pull_request]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run UI/UX Audit
        run: |
          chmod +x ./scripts/uiux-audit.sh
          ./scripts/uiux-audit.sh --all
      - name: Upload Reports
        uses: actions/upload-artifact@v3
        with:
          name: uiux-reports
          path: docs/uiux-reports/
```

## 🐛 Dépannage

### Script non exécutable

```bash
chmod +x ./scripts/uiux-audit.sh
```

### Erreur "Module introuvable"

Vérifiez que le chemin `BASE_DIR` dans le script correspond à votre structure :

```bash
# Modifier la ligne 27 du script si nécessaire
BASE_DIR="/Users/salmenktata/Projets/GitHub/QuelyosSuite/dashboard-client/src/pages"
```

### Permissions refusées

```bash
# Accorder les permissions
sudo chmod +x ./scripts/uiux-audit.sh
```

## 📚 Ressources

- **Charte UI/UX** : `.claude/UIUX_CHECKLIST.md`
- **Guide Économie Tokens** : `.claude/GUIDE_ECONOMIE_TOKENS.md`
- **Commande Claude** : `/uiux --fix [fichier]`

## 🤝 Contribution

Pour améliorer le script :

1. Testez sur plusieurs modules
2. Identifiez les patterns récurrents
3. Proposez des corrections automatiques supplémentaires
4. Mettez à jour la documentation

---

**Dernière mise à jour** : 2026-01-27
**Version** : 1.0.0
**Auteur** : Claude Code (Anthropic)

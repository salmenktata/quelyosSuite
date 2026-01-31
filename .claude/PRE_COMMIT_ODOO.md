# 🔒 Checklist Pré-Commit Modules Odoo

**OBLIGATOIRE** : Vérifier AVANT chaque commit touchant `odoo-backend/addons/quelyos_*/`

---

## ✅ Checklist Rapide

```bash
# 1. Lancer vérification automatique
./scripts/check-odoo-isolation.sh

# 2. Si ÉCHEC → Corriger violations avant commit
# 3. Si SUCCÈS → Procéder au commit
```

---

## 📋 Vérifications Manuelles

### Nouveau fichier modèle Python ?
- [ ] Fichier dans `odoo-backend/addons/quelyos_*/models/`
- [ ] Docstring en en-tête expliquant le modèle
- [ ] Si `_inherit` → Lire section ci-dessous

### Modèle hérité (_inherit) ?
- [ ] Tous les champs ajoutés ont préfixe `x_` ou `tenant_id` ou `quelyos_`
- [ ] Aucun champ core Odoo modifié (required, default, readonly)
- [ ] Si override `create/write/unlink` → Appel `super()` présent
- [ ] Pas de SQL direct sauf requêtes analytiques complexes

### Modification __manifest__.py ?
- [ ] Version incrémentée (19.0.X.Y.Z)
- [ ] Nouvelles dépendances OCA documentées avec commentaire RAISON
- [ ] `auto_install = False` (sauf quelyos_core)

### Tests manuels recommandés
```bash
# Installation propre du module
docker exec odoo-backend odoo-bin -d test_db -i quelyos_api --stop-after-init

# Désinstallation propre (pas d'erreur)
docker exec odoo-backend odoo-bin -d test_db -u quelyos_api --stop-after-init
```

---

## 🚨 Violations Critiques = STOP

**NE JAMAIS COMMITTER** si :
- ❌ Override CRUD sans `super()`
- ❌ `auto_install=True` hors orchestrateur
- ❌ Modification champ core Odoo (ex: `name = fields.Char(required=False)`)
- ❌ Script `check-odoo-isolation.sh` en erreur

---

## 📖 Voir aussi
- `.claude/ODOO_ISOLATION_RULES.md` (guide complet)
- `CLAUDE.md` section "Isolation Odoo"

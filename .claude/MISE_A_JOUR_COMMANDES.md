# Mise à Jour Commandes Slash - Post Migration

## ✅ Commandes Mises à Jour

### restart-finance.md
- ✅ Mise à jour architecture : `apps/finance-os/` → `dashboard-client/` + `VITE_EDITION=finance`
- ✅ Port 3010 maintenu
- ✅ Mentions migration ajoutées
- ✅ Notes techniques actualisées

## ⏸️ Commandes à Mettre à Jour

### Commandes Restart Éditions (6 restantes)

**Template à appliquer** :
- Architecture : `dashboard-client/` + `VITE_EDITION={edition}`
- Ancienne mention : `apps/{edition}-os/` → Supprimé
- Nouvelle structure : Système éditions

**Liste** :
1. `restart-team.md` (port 3015, modules: hr)
2. `restart-sales.md` (port 3013, modules: crm + marketing)
3. `restart-store.md` (port 3011, modules: store + marketing)
4. `restart-copilote.md` (port 3012, modules: stock + hr + GMAO)
5. `restart-retail.md` (port 3014, modules: pos + store + stock)
6. `restart-support.md` (port 3016, modules: support + crm)

### Commandes Mentionnant apps/

**Fichiers concernés** :
- `align.md` — Vérifier mentions apps/*
- `clean.md` — Nettoyer références apps/*
- `coherence.md` — Mise à jour architecture
- `no-odoo.md` — Périmètre éditions
- `polish.md` — Références apps/*
- `restart-all.md` — Liste SaaS (déjà correct)

## 📝 Modèle de Mise à Jour

### Pour restart-{edition}.md

```markdown
## Migration
⚠️ **Ancienne architecture** : `apps/{edition}-os/` (supprimé)  
✅ **Nouvelle architecture** : `dashboard-client/` + `VITE_EDITION={edition}`

## Commandes utilisées
\`\`\`bash
cd dashboard-client && VITE_EDITION={edition} pnpm dev
\`\`\`
```

### Pour autres commandes

**Remplacements** :
- `apps/finance-os/` → `dashboard-client/` (édition Finance)
- `apps/store-os/` → `dashboard-client/` (édition Store)
- etc.

**Ajouts** :
- Mention système éditions
- Variables `VITE_EDITION={edition}`
- Références vers documentation éditions

## 🔗 Documentation Système Éditions

**À mentionner dans commandes** :
- `dashboard-client/README-EDITIONS.md`
- `docs/EDITIONS_DEV_GUIDE.md`
- `docs/EDITIONS_ADMIN_GUIDE.md`
- `.claude/migration/README_MIGRATION.md`

## ⚡ Actions Rapides

### 1. Copier/Adapter restart-finance.md

```bash
# Pour chaque édition
for ed in team sales store copilote retail support; do
  cp .claude/commands/restart-finance.md .claude/commands/restart-${ed}.md
  # Adapter manuellement avec les bons ports/modules
done
```

### 2. Rechercher apps/ dans commandes

```bash
grep -l "apps/" .claude/commands/*.md
```

### 3. Mise à jour globale

- Remplacer `apps/{edition}-os/` par `dashboard-client/`
- Ajouter `VITE_EDITION={edition}` avant `pnpm dev`
- Mettre à jour Notes Techniques
- Ajouter section Migration

## 📊 Progression

- ✅ **1/7** commandes restart-* mises à jour (restart-finance)
- ⏸️ **6/7** restantes
- ⏸️ **~6** autres commandes à vérifier

**Priorité** : restart-* (utilisées quotidiennement)

---

**Date** : 2026-01-31  
**Statut** : En cours  
**Prochaine action** : Mettre à jour restart-team, restart-sales, etc.

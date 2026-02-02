# Commande /deploy-vps - Déploiement VPS Automatisé

## Description

Déploie les frontends Quelyos Suite vers le VPS Contabo via `scripts/deploy-vps.sh`.

## Usage

```bash
/deploy-vps                    # Deploy complet (4 apps)
/deploy-vps dashboard          # Deploy 1 app
/deploy-vps --dry-run          # Simulation
/deploy-vps --skip-backup      # Sans backup DB
```

## Arguments supportés

- `dashboard` | `vitrine` | `ecommerce` | `superadmin` — App ciblée
- `--dry-run` — Simulation sans exécution
- `--skip-backup` — Skip backup PostgreSQL
- `--skip-odoo` — Skip upgrade module backend
- Combinables : `/deploy-vps dashboard --skip-backup --skip-odoo`

---

## Workflow

### Étape 1 : Vérification pré-déploiement

**1.1. Vérifier que le working tree est clean**

```bash
git status --porcelain
```

Si des changements non commités existent, demander :

```typescript
AskUserQuestion({
  questions: [{
    question: "Des changements non commités détectés. Que faire ?",
    header: "Git status",
    multiSelect: false,
    options: [
      { label: "Commiter d'abord", description: "Lancer /ship avant de déployer (Recommandé)" },
      { label: "Continuer quand même", description: "Déployer avec les changements non commités" },
      { label: "Annuler", description: "Arrêter le déploiement" }
    ]
  }]
})
```

**1.2. Vérifier branche main**

Si pas sur `main`, alerter l'utilisateur.

### Étape 2 : Construire la commande

Mapper les arguments utilisateur vers les options du script :

| Argument utilisateur | Option script |
|---------------------|---------------|
| `dashboard` | `--app=dashboard` |
| `vitrine` | `--app=vitrine` |
| `ecommerce` | `--app=ecommerce` |
| `superadmin` | `--app=superadmin` |
| `--dry-run` | `--dry-run` |
| `--skip-backup` | `--skip-backup` |
| `--skip-odoo` | `--skip-odoo` |

### Étape 3 : Exécuter le déploiement

```bash
./scripts/deploy-vps.sh <options>
```

Timeout : 10 minutes max (600000ms).

### Étape 4 : Rapport post-déploiement

Afficher un résumé concis :

```
✅ Déploiement terminé

  App(s) : dashboard
  Durée : ~2m30s
  Health checks : 5/5 OK

  🔗 https://backoffice.quelyos.com
```

Si erreurs, afficher les services en échec et suggérer des actions correctives.

---

## Exemples

```bash
# Déployer uniquement le dashboard après un fix
/deploy-vps dashboard --skip-backup --skip-odoo

# Déploiement complet avec backup
/deploy-vps

# Tester sans rien exécuter
/deploy-vps --dry-run

# Déployer e-commerce + skip backend
/deploy-vps ecommerce --skip-odoo
```

---

## Mapping noms locaux → VPS

| Local | VPS | Domaine |
|-------|-----|---------|
| `dashboard-client` | `dashboard` | backoffice.quelyos.com |
| `vitrine-quelyos` | `vitrine` | quelyos.com |
| `vitrine-client` | `ecommerce` | shop.quelyos.com |
| `super-admin-client` | `superadmin` | admin.quelyos.com |

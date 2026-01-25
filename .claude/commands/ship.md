# Commande /ship - Commit & Push Rapide vers GitHub

## Description

Commande rapide pour commiter et pusher vos changements vers la branche `main` de GitHub avec un message de commit conventionnel (feat, fix, chore, etc.). Automatise le workflow git standard en demandant les informations nécessaires.

## Usage

```bash
/ship                # Commit et push tous les changements
/ship --amend        # Amende le dernier commit et force push
```

**Exemples** :
- `/ship` - Commit standard avec message conventionnel
- `/ship --amend` - Corriger le dernier commit (⚠️ dangereux si déjà pushé)

---

## Workflow de la commande

### Étape 1 : Vérification État Git

**1.1. Vérifier la branche courante**

```bash
git branch --show-current
```

**Vérifications :**
- [ ] Branche = `main` (ou confirmer si branche différente)
- [ ] Repo est bien un repo Git
- [ ] Remote `origin` configuré

**Si violations :**
```
⚠️ ATTENTION : Branche Différente

Vous êtes actuellement sur : feature/new-cart
Le push ira vers : origin/feature/new-cart (pas main)

Souhaitez-vous :
1. Continuer sur cette branche
2. Basculer sur main
3. Annuler
```

**1.2. Vérifier état du working directory**

```bash
git status --porcelain
```

**Si aucun changement :**
```
✅ Working directory clean

Aucun fichier modifié à commiter.
```
→ Arrêter la commande

**1.3. Afficher résumé des changements**

```bash
# Fichiers modifiés
git status --short

# Statistiques
git diff --stat
```

**Afficher au format lisible :**
```
📝 Changements détectés :

Modifiés (12) :
  M backend/addons/quelyos_api/controllers/cms.py
  M frontend/src/components/ProductCard.tsx
  M backoffice/src/pages/Products.tsx
  ...

Nouveaux (3) :
  ?? backend/addons/quelyos_api/models/subscription.py
  ?? frontend/src/hooks/useCurrencies.ts
  ?? .claude/commands/ship.md

Supprimés (1) :
  D frontend/src/components/OldComponent.tsx

Statistiques :
  16 fichiers modifiés, +850 insertions, -120 suppressions
```

---

### Étape 2 : Sélection Type de Commit

**2.1. Demander type de commit avec AskUserQuestion**

```typescript
AskUserQuestion({
  questions: [{
    question: "Quel type de commit souhaitez-vous créer ?",
    header: "Type commit",
    multiSelect: false,
    options: [
      {
        label: "feat: Nouvelle fonctionnalité",
        description: "Ajout d'une nouvelle feature utilisateur"
      },
      {
        label: "fix: Correction de bug",
        description: "Correction d'un bug existant"
      },
      {
        label: "chore: Maintenance",
        description: "Mise à jour dépendances, config, etc."
      },
      {
        label: "refactor: Refactoring",
        description: "Modification code sans changer comportement"
      }
    ]
  }]
})
```

**Mapping réponse → préfixe :**
- "feat: Nouvelle fonctionnalité" → `feat:`
- "fix: Correction de bug" → `fix:`
- "chore: Maintenance" → `chore:`
- "refactor: Refactoring" → `refactor:`

**Autres types supportés** (si l'utilisateur les tape manuellement) :
- `docs:` - Documentation
- `style:` - Formatage code (pas CSS)
- `test:` - Ajout/correction tests
- `perf:` - Améliorations performance
- `ci:` - Configuration CI/CD
- `build:` - Système de build
- `revert:` - Annulation commit précédent

---

### Étape 3 : Rédaction Message de Commit

**3.1. Analyser les changements automatiquement**

Lire les fichiers modifiés pour suggérer un message :

```bash
# Analyser les diffs
git diff --stat
git log --oneline -5  # Voir style des messages précédents
```

**3.2. Suggérer un message basé sur les changements**

**Exemples de suggestions intelligentes :**

| Fichiers modifiés | Suggestion |
|-------------------|------------|
| `models/subscription.py` (nouveau) | "ajout modèle subscription + plans abonnement" |
| `ProductCard.tsx`, `api.ts` | "amélioration affichage produits + fix appels API" |
| `package.json`, `requirements.txt` | "mise à jour dépendances (security patches)" |
| `*.test.ts` uniquement | "ajout tests unitaires composants" |

**3.3. Demander confirmation/modification du message**

```typescript
AskUserQuestion({
  questions: [{
    question: "Message du commit (description courte) :",
    header: "Message",
    multiSelect: false,
    options: [
      {
        label: "ajout multi-images produits + gestion variantes",
        description: "Message suggéré basé sur vos changements (Recommandé)"
      },
      {
        label: "Écrire un message personnalisé",
        description: "Saisir manuellement le message de commit"
      }
    ]
  }]
})
```

**Si "personnalisé" sélectionné**, redemander avec champ texte libre.

**3.4. Format final du commit**

```
<type>: <message>

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**Exemples :**
```
feat: ajout multi-images produits + gestion variantes

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

```
fix: calcul stock avec variantes + affichage catalogue

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

### Étape 4 : Stage des Fichiers

**4.1. Stratégie de staging intelligente**

**Par défaut : Stage TOUS les fichiers modifiés**
```bash
git add -A
```

**Exceptions automatiques (JAMAIS stage automatiquement) :**
- `.env*` (sauf `.env.example`)
- `*.log`
- `*.tmp`
- Fichiers > 100MB (demander confirmation)

**4.2. Vérifier fichiers sensibles**

```bash
# Vérifier si secrets potentiels
git diff --cached | grep -i "password\|secret\|api_key\|token"
```

**Si secrets détectés :**
```
🚨 ALERTE SÉCURITÉ

Des secrets potentiels ont été détectés :
- backend/.env.production:12 - "DB_PASSWORD=..."
- frontend/config.ts:45 - "API_KEY=..."

Actions :
1. ❌ Ne PAS commiter (Recommandé)
2. Retirer ces fichiers du stage
3. Continuer quand même (⚠️ Dangereux)
```

**4.3. Afficher fichiers staged**

```bash
git status --short
```

```
📦 Fichiers prêts à commiter :

  M backend/addons/quelyos_api/controllers/cms.py
  M frontend/src/components/ProductCard.tsx
  A backend/addons/quelyos_api/models/subscription.py
  A .claude/commands/ship.md
  D frontend/src/components/OldComponent.tsx

Total : 16 fichiers (+850, -120 lignes)
```

---

### Étape 5 : Création du Commit

**5.1. Exécuter le commit**

```bash
git commit -m "$(cat <<'EOF'
<type>: <message>

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

**Exemple réel :**
```bash
git commit -m "$(cat <<'EOF'
feat: ajout multi-images produits + gestion variantes

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

**5.2. Vérifier succès du commit**

```bash
# Vérifier hash commit créé
git log -1 --oneline

# Afficher stats du commit
git show --stat HEAD
```

**Afficher confirmation :**
```
✅ Commit créé avec succès

  Hash : a8c038f
  Type : feat
  Message : ajout multi-images produits + gestion variantes
  Fichiers : 16 modifiés (+850, -120)
```

---

### Étape 6 : Push vers GitHub

**6.1. Vérifier upstream configuré**

```bash
git rev-parse --abbrev-ref --symbolic-full-name @{u}
```

**Si upstream non configuré :**
```bash
# Configurer upstream pour branche courante
git push -u origin <branche-courante>
```

**6.2. Exécuter le push**

```bash
git push origin <branche-courante>
```

**Pour main :**
```bash
git push origin main
```

**6.3. Gestion des erreurs courantes**

#### Erreur : Remote divergent (rejet push)

```
! [rejected]        main -> main (non-fast-forward)
```

**Actions suggérées :**
```
⚠️ Push rejeté : Branche distante divergente

Votre branche locale est derrière origin/main.

Options :
1. Pull puis push (Recommandé)
   git pull --rebase origin main && git push

2. Force push (⚠️ DANGEREUX - écrase historique distant)
   git push --force-with-lease origin main

3. Annuler et vérifier manuellement
```

#### Erreur : Authentification échouée

```
remote: Permission denied (publickey)
```

**Actions suggérées :**
```
🔐 Erreur Authentification GitHub

Vérifier :
1. SSH key configurée : ls ~/.ssh/id_*.pub
2. Clé ajoutée à GitHub : https://github.com/settings/keys
3. Remote URL correct : git remote -v

Si HTTPS utilisé, vérifier token GitHub :
git remote set-url origin git@github.com:username/repo.git
```

**6.4. Confirmation succès push**

```bash
# Vérifier commit pushed
git log origin/main -1 --oneline
```

**Afficher confirmation :**
```
🚀 Push réussi vers GitHub !

  Branche : main
  Commit : a8c038f - feat: ajout multi-images produits + gestion variantes
  Remote : https://github.com/username/QuelyosSuite

Voir sur GitHub :
https://github.com/username/QuelyosSuite/commit/a8c038f
```

---

### Étape 7 : Mise à Jour LOGME.md (Optionnel)

**7.1. Demander si mise à jour LOGME.md**

**Seulement si commit majeur** (détecté automatiquement) :
- Type `feat:` (nouvelle fonctionnalité)
- ≥ 10 fichiers modifiés
- Modifications dans plusieurs dossiers (backend + frontend + backoffice)

```typescript
AskUserQuestion({
  questions: [{
    question: "Ce commit semble majeur. Mettre à jour LOGME.md ?",
    header: "Changelog",
    multiSelect: false,
    options: [
      {
        label: "Oui, ajouter au LOGME",
        description: "Ajouter une ligne dans LOGME.md (Recommandé)"
      },
      {
        label: "Non, skip",
        description: "Ne pas mettre à jour LOGME.md"
      }
    ]
  }]
})
```

**7.2. Si oui, ajouter ligne à LOGME.md**

```bash
# Lire LOGME.md
cat LOGME.md

# Ajouter ligne au début (après titre)
echo "- $(date +%Y-%m-%d) : <message commit>" >> LOGME.md

# Commit + push LOGME.md
git add LOGME.md
git commit -m "docs: mise à jour LOGME.md"
git push origin main
```

**Format ligne LOGME :**
```markdown
- 2026-01-25 : Ajout multi-images produits + gestion variantes (feat)
```

---

## Règles de Sécurité Git

### ✅ À FAIRE

1. **Toujours vérifier les fichiers staged** avant commit
2. **Ne jamais commiter de secrets** (.env, credentials, tokens)
3. **Utiliser messages descriptifs** (pas "WIP" ou "fix")
4. **Préférer --force-with-lease** à --force (protège contre écrasement accidentel)
5. **Vérifier la branche** avant push

### ❌ À ÉVITER

1. ❌ `git push --force` sur main (utiliser `--force-with-lease`)
2. ❌ Commiter fichiers `.env*` (sauf `.env.example`)
3. ❌ Messages vagues : "fix", "update", "WIP"
4. ❌ Commits énormes (> 50 fichiers sans raison)
5. ❌ Push sans vérifier `git status` avant

---

## Mode `--amend` (Avancé)

**Utilisation :**
```bash
/ship --amend
```

**Workflow modifié :**

1. Vérifier dernier commit non pushé
   ```bash
   git log origin/main..HEAD
   ```

2. Si commit déjà pushé → **ALERTER UTILISATEUR**
   ```
   ⚠️ ATTENTION : Commit déjà pushé

   Le commit a8c038f est déjà sur origin/main.
   Amender nécessitera un force push (dangereux).

   Options :
   1. Créer un nouveau commit (Recommandé)
   2. Amender + force push (⚠️ Déconseillé)
   3. Annuler
   ```

3. Si commit local uniquement → Amender
   ```bash
   git add -A
   git commit --amend --no-edit
   git push origin main
   ```

4. Si commit pushé + utilisateur confirme force push
   ```bash
   git add -A
   git commit --amend --no-edit
   git push --force-with-lease origin main
   ```

---

## Types de Commits Conventionnels

| Type | Utilisation | Exemple |
|------|-------------|---------|
| `feat:` | Nouvelle fonctionnalité | "feat: ajout système abonnements" |
| `fix:` | Correction bug | "fix: calcul stock avec variantes" |
| `chore:` | Maintenance, dépendances | "chore: mise à jour React 19" |
| `refactor:` | Refactoring sans changement fonctionnel | "refactor: extraction hook useAuth" |
| `docs:` | Documentation uniquement | "docs: mise à jour README installation" |
| `style:` | Formatage code | "style: format avec prettier" |
| `test:` | Ajout/modification tests | "test: couverture composants panier" |
| `perf:` | Amélioration performance | "perf: lazy loading images catalogue" |
| `ci:` | Configuration CI/CD | "ci: ajout GitHub Actions deploy" |
| `build:` | Système de build | "build: config webpack production" |
| `revert:` | Annulation commit | "revert: retour version stable auth" |

---

## Exemples d'Utilisation

### Exemple 1 : Feature Simple

```bash
$ /ship

📝 Changements détectés :
  M frontend/src/components/ProductCard.tsx
  M frontend/src/hooks/useCart.ts
  Total : 2 fichiers (+45, -12)

Type de commit ?
→ feat: Nouvelle fonctionnalité

Message suggéré : "ajout bouton achat rapide produits"
→ Confirmer

✅ Commit créé : feat: ajout bouton achat rapide produits
🚀 Push réussi vers main
```

### Exemple 2 : Fix Bug

```bash
$ /ship

📝 Changements détectés :
  M backend/addons/quelyos_api/models/product.py
  M frontend/src/lib/api.ts

Type de commit ?
→ fix: Correction de bug

Message suggéré : "correction calcul stock avec variantes"
→ Confirmer

✅ Commit créé : fix: correction calcul stock avec variantes
🚀 Push réussi vers main
```

### Exemple 3 : Branche Feature

```bash
$ /ship

⚠️ ATTENTION : Branche Différente
Vous êtes sur : feature/subscriptions
Push ira vers : origin/feature/subscriptions

Continuer ?
→ Oui

Type de commit ?
→ feat: Nouvelle fonctionnalité

Message : "implémentation système abonnements Stripe"

✅ Commit créé
🚀 Push réussi vers feature/subscriptions
```

---

## Intégration avec Workflow Odoo

**IMPORTANT** : Si modifications dans `backend/addons/quelyos_api/models/` :

```
⚠️ Modifications Modèle Odoo Détectées

Fichiers modifiés :
- backend/addons/quelyos_api/models/subscription.py

Actions requises APRÈS commit :
1. Incrémenter version dans __manifest__.py
2. Exécuter : cd backend && ./upgrade.sh quelyos_api
3. Redémarrer Odoo si nécessaire

Voulez-vous que je vous rappelle ces étapes après le push ?
→ Oui / Non
```

---

## Objectif Final

Simplifier le workflow Git quotidien :
- 🚀 **Commit + Push en une commande**
- 📝 **Messages conventionnels automatiques**
- 🔒 **Sécurité intégrée** (détection secrets)
- ✅ **Validation avant push**
- 📊 **Feedback clair** à chaque étape

**Un workflow Git rapide et sécurisé.**

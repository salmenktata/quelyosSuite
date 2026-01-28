# Commande /commit - Commit Rapide (sans Push)

## Description

Commande rapide pour créer un commit avec un message conventionnel (feat, fix, chore, etc.) **sans pusher** vers GitHub. Utile pour préparer plusieurs commits avant un push groupé.

## Usage

```bash
/commit              # Commit tous les changements stagés/modifiés
/commit --amend      # Amende le dernier commit local
```

**Exemples** :
- `/commit` - Commit standard avec message conventionnel
- `/commit --amend` - Corriger le dernier commit local

**Différence avec /ship** :
- `/commit` = commit uniquement (local)
- `/ship` = commit + push (vers remote)

---

## Workflow de la commande

### Étape 1 : Vérification État Git

**1.1. Vérifier état du working directory**

```bash
git status --porcelain
```

**Si aucun changement :**
```
✅ Working directory clean

Aucun fichier modifié à commiter.
```
→ Arrêter la commande

**1.2. Afficher résumé des changements**

```bash
git status --short
git diff --stat
```

**Afficher au format lisible :**
```
📝 Changements détectés :

Modifiés (5) :
  M src/components/ProductCard.tsx
  M src/pages/Products.tsx
  ...

Nouveaux (2) :
  ?? src/hooks/useNewHook.ts
  ...

Statistiques :
  7 fichiers modifiés, +150 insertions, -30 suppressions
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
- `style:` - Formatage code
- `test:` - Ajout/correction tests
- `perf:` - Améliorations performance

---

### Étape 3 : Rédaction Message de Commit

**3.1. Analyser les changements et suggérer un message**

Basé sur les fichiers modifiés, proposer un message pertinent.

**3.2. Demander confirmation/modification du message**

```typescript
AskUserQuestion({
  questions: [{
    question: "Message du commit (description courte) :",
    header: "Message",
    multiSelect: false,
    options: [
      {
        label: "<message suggéré basé sur les changements>",
        description: "Message suggéré (Recommandé)"
      },
      {
        label: "Écrire un message personnalisé",
        description: "Saisir manuellement le message"
      }
    ]
  }]
})
```

---

### Étape 4 : Stage des Fichiers

**4.1. Stage tous les fichiers modifiés**

```bash
git add -A
```

**Exceptions (ne jamais stager automatiquement) :**
- `.env*` (sauf `.env.example`)
- `*.log`
- Fichiers avec secrets potentiels

**4.2. Vérifier fichiers sensibles**

Si secrets détectés → alerter et demander confirmation.

---

### Étape 5 : Création du Commit

**5.1. Exécuter le commit**

```bash
git commit -m "$(cat <<'EOF'
<type>: <message>

Co-Authored-By: Claude <model>  <noreply@anthropic.com>
EOF
)"
```

**5.2. Vérifier succès du commit**

```bash
git log -1 --oneline
```

**Afficher confirmation :**
```
✅ Commit créé avec succès (local)

  Hash : a8c038f
  Type : feat
  Message : ajout système de notifications
  Fichiers : 7 modifiés (+150, -30)

💡 Pour pusher : /ship ou git push origin main
```

---

## Mode `--amend`

**Workflow modifié :**

1. Vérifier dernier commit
   ```bash
   git log -1 --oneline
   ```

2. Afficher les changements à ajouter au commit existant

3. Amender le commit
   ```bash
   git add -A
   git commit --amend --no-edit
   ```

   Ou avec nouveau message :
   ```bash
   git commit --amend -m "nouveau message"
   ```

4. Confirmation :
   ```
   ✅ Commit amendé avec succès

     Hash : b9d149g (nouveau)
     Message : <message mis à jour>

   ⚠️ Si déjà pushé, utilisez : git push --force-with-lease
   ```

---

## Types de Commits Conventionnels

| Type | Utilisation | Exemple |
|------|-------------|---------|
| `feat:` | Nouvelle fonctionnalité | "feat: ajout filtre recherche" |
| `fix:` | Correction bug | "fix: calcul total panier" |
| `chore:` | Maintenance | "chore: mise à jour deps" |
| `refactor:` | Refactoring | "refactor: extraction hook" |
| `docs:` | Documentation | "docs: mise à jour README" |
| `style:` | Formatage | "style: format prettier" |
| `test:` | Tests | "test: ajout tests panier" |
| `perf:` | Performance | "perf: lazy loading images" |

---

## Règles de Sécurité

### ✅ À FAIRE
- Vérifier les fichiers stagés avant commit
- Utiliser messages descriptifs
- Ne jamais commiter de secrets

### ❌ À ÉVITER
- Messages vagues : "fix", "update", "WIP"
- Commiter fichiers `.env*`
- Commits énormes sans raison

---

## Exemples d'Utilisation

### Exemple 1 : Commit Simple

```bash
$ /commit

📝 Changements détectés :
  M src/components/Button.tsx
  M src/styles/button.css
  Total : 2 fichiers (+25, -10)

Type de commit ?
→ fix: Correction de bug

Message suggéré : "correction style bouton hover"
→ Confirmer

✅ Commit créé : a8c038f - fix: correction style bouton hover

💡 Pour pusher : /ship ou git push
```

### Exemple 2 : Plusieurs commits avant push

```bash
$ /commit
✅ Commit créé : a8c038f - feat: ajout composant Modal

$ /commit
✅ Commit créé : b9d149g - fix: fermeture modal sur Escape

$ /ship
🚀 Push réussi (2 commits)
```

---

## Objectif

Permettre de créer des commits locaux rapidement :
- 📝 **Commits atomiques** sans pusher immédiatement
- 🔄 **Workflow flexible** : plusieurs commits puis un seul push
- ✅ **Messages conventionnels** automatiques
- 🔒 **Sécurité** : vérification fichiers sensibles

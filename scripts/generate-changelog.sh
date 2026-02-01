#!/bin/bash
# Génère automatiquement le CHANGELOG depuis les tags Git
# Usage: ./scripts/generate-changelog.sh

set -e

OUTPUT_FILE="CHANGELOG.md"

echo "# Changelog" > $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo "Toutes les modifications notables de ce projet sont documentées dans ce fichier." >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo "Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/)," >> $OUTPUT_FILE
echo "et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/)." >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# Récupérer tous les tags triés par version
TAGS=($(git tag --sort=-version:refname))

if [ ${#TAGS[@]} -eq 0 ]; then
  echo "Aucun tag trouvé"
  exit 0
fi

# Pour chaque tag
for i in "${!TAGS[@]}"; do
  TAG=${TAGS[$i]}
  NEXT_TAG=${TAGS[$((i+1))]}

  echo "## [$TAG] - $(git log -1 --format=%ai $TAG | cut -d' ' -f1)" >> $OUTPUT_FILE
  echo "" >> $OUTPUT_FILE

  # Récupérer les commits entre ce tag et le précédent
  if [ -z "$NEXT_TAG" ]; then
    # Premier tag, prendre tous les commits jusqu'au début
    COMMITS=$(git log $TAG --oneline --no-decorate --reverse)
  else
    COMMITS=$(git log $NEXT_TAG..$TAG --oneline --no-decorate --reverse)
  fi

  # Classifier les commits
  FEATURES=""
  FIXES=""
  REFACTOR=""
  DOCS=""
  CHORE=""
  OTHER=""

  while IFS= read -r commit; do
    if [[ $commit =~ ^[a-f0-9]+\ feat ]]; then
      FEATURES="$FEATURES\n- ${commit#* }"
    elif [[ $commit =~ ^[a-f0-9]+\ fix ]]; then
      FIXES="$FIXES\n- ${commit#* }"
    elif [[ $commit =~ ^[a-f0-9]+\ refactor ]]; then
      REFACTOR="$REFACTOR\n- ${commit#* }"
    elif [[ $commit =~ ^[a-f0-9]+\ docs ]]; then
      DOCS="$DOCS\n- ${commit#* }"
    elif [[ $commit =~ ^[a-f0-9]+\ chore ]]; then
      CHORE="$CHORE\n- ${commit#* }"
    else
      OTHER="$OTHER\n- ${commit#* }"
    fi
  done <<< "$COMMITS"

  # Afficher les sections
  if [ -n "$FEATURES" ]; then
    echo "### ✨ Nouvelles Fonctionnalités" >> $OUTPUT_FILE
    echo -e "$FEATURES" >> $OUTPUT_FILE
    echo "" >> $OUTPUT_FILE
  fi

  if [ -n "$FIXES" ]; then
    echo "### 🐛 Corrections de Bugs" >> $OUTPUT_FILE
    echo -e "$FIXES" >> $OUTPUT_FILE
    echo "" >> $OUTPUT_FILE
  fi

  if [ -n "$REFACTOR" ]; then
    echo "### ♻️ Refactorisation" >> $OUTPUT_FILE
    echo -e "$REFACTOR" >> $OUTPUT_FILE
    echo "" >> $OUTPUT_FILE
  fi

  if [ -n "$DOCS" ]; then
    echo "### 📚 Documentation" >> $OUTPUT_FILE
    echo -e "$DOCS" >> $OUTPUT_FILE
    echo "" >> $OUTPUT_FILE
  fi

  if [ -n "$CHORE" ]; then
    echo "### 🔧 Maintenance" >> $OUTPUT_FILE
    echo -e "$CHORE" >> $OUTPUT_FILE
    echo "" >> $OUTPUT_FILE
  fi

  if [ -n "$OTHER" ]; then
    echo "### 📦 Autres Changements" >> $OUTPUT_FILE
    echo -e "$OTHER" >> $OUTPUT_FILE
    echo "" >> $OUTPUT_FILE
  fi
done

echo "✅ CHANGELOG.md généré avec succès !"
echo "📄 Contenu: $OUTPUT_FILE"

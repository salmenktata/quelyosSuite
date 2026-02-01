#!/bin/bash
# Script de release automatique avec semantic versioning
# Usage: ./scripts/release.sh [patch|minor|major]

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction d'aide
show_help() {
  echo -e "${BLUE}Usage:${NC} ./scripts/release.sh [patch|minor|major]"
  echo ""
  echo "Semantic Versioning:"
  echo -e "  ${GREEN}patch${NC}  - Bug fixes (1.0.0 → 1.0.1)"
  echo -e "  ${GREEN}minor${NC}  - New features (1.0.0 → 1.1.0)"
  echo -e "  ${GREEN}major${NC}  - Breaking changes (1.0.0 → 2.0.0)"
  echo ""
  echo "Exemples:"
  echo "  ./scripts/release.sh patch   # Pour un bug fix"
  echo "  ./scripts/release.sh minor   # Pour une nouvelle feature"
  echo "  ./scripts/release.sh major   # Pour un breaking change"
}

# Vérifier les arguments
if [ $# -eq 0 ]; then
  show_help
  exit 1
fi

VERSION_TYPE=$1

if [[ ! "$VERSION_TYPE" =~ ^(patch|minor|major)$ ]]; then
  echo -e "${RED}❌ Type de version invalide: $VERSION_TYPE${NC}"
  show_help
  exit 1
fi

# Vérifier qu'on est sur la branche main
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo -e "${YELLOW}⚠️  Vous n'êtes pas sur la branche main (actuellement sur: $CURRENT_BRANCH)${NC}"
  read -p "Voulez-vous continuer quand même? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Vérifier qu'il n'y a pas de changements non commités
if ! git diff-index --quiet HEAD --; then
  echo -e "${YELLOW}⚠️  Vous avez des changements non commités${NC}"
  echo -e "${BLUE}📝 Fichiers modifiés:${NC}"
  git status --short
  echo ""
  read -p "Voulez-vous les commiter maintenant? (Y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    echo -e "${BLUE}💬 Message du commit:${NC}"
    read -p "> " COMMIT_MSG

    if [ -z "$COMMIT_MSG" ]; then
      echo -e "${RED}❌ Message vide, abandon${NC}"
      exit 1
    fi

    git add .
    git commit -m "$COMMIT_MSG

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
    echo -e "${GREEN}✅ Changements commités${NC}"
  else
    echo -e "${RED}❌ Release annulée (changements non commités)${NC}"
    exit 1
  fi
fi

# Récupérer le dernier tag
LATEST_TAG=$(git tag --sort=-version:refname | head -1)

if [ -z "$LATEST_TAG" ]; then
  echo -e "${YELLOW}⚠️  Aucun tag trouvé, création de v1.0.0${NC}"
  NEW_VERSION="v1.0.0"
else
  echo -e "${BLUE}📌 Version actuelle: $LATEST_TAG${NC}"

  # Retirer le 'v' pour le calcul
  CURRENT_VERSION=${LATEST_TAG#v}

  # Séparer major.minor.patch
  IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

  # Incrémenter selon le type
  case $VERSION_TYPE in
    major)
      MAJOR=$((MAJOR + 1))
      MINOR=0
      PATCH=0
      ;;
    minor)
      MINOR=$((MINOR + 1))
      PATCH=0
      ;;
    patch)
      PATCH=$((PATCH + 1))
      ;;
  esac

  NEW_VERSION="v${MAJOR}.${MINOR}.${PATCH}"
fi

echo -e "${GREEN}🚀 Nouvelle version: $NEW_VERSION${NC}"
echo ""

# Afficher les commits depuis le dernier tag
if [ -n "$LATEST_TAG" ]; then
  echo -e "${BLUE}📝 Commits depuis $LATEST_TAG:${NC}"
  git log $LATEST_TAG..HEAD --oneline --no-decorate
  echo ""
fi

# Demander confirmation
read -p "Confirmer la création du tag $NEW_VERSION et le déploiement? (Y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Nn]$ ]]; then
  echo -e "${YELLOW}⚠️  Release annulée${NC}"
  exit 0
fi

# Créer le tag
echo -e "${BLUE}🏷️  Création du tag $NEW_VERSION...${NC}"
git tag -a "$NEW_VERSION" -m "Release $NEW_VERSION"

# Pusher le tag
echo -e "${BLUE}📤 Push du tag vers GitHub...${NC}"
git push origin "$NEW_VERSION"

echo ""
echo -e "${GREEN}✅ Tag $NEW_VERSION créé et pushé !${NC}"
echo ""
echo -e "${BLUE}🚀 Le déploiement CI/CD devrait se lancer automatiquement${NC}"
echo -e "${BLUE}📊 Suivre le déploiement:${NC}"
echo -e "   ${YELLOW}gh run watch${NC}"
echo -e "   ${YELLOW}gh run list --workflow=deploy.yml --limit 5${NC}"
echo ""
echo -e "${BLUE}🌐 URL de production (après déploiement):${NC}"
echo -e "   https://\${PRODUCTION_DOMAIN}"

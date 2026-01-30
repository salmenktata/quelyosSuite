#!/bin/bash
# Script pour corriger automatiquement les variables non utilisées
# Préfixe avec underscore les variables déclarées mais jamais lues

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔧 Correction des variables non utilisées...${NC}"

# Obtenir la liste des erreurs TS6133
npm run type-check 2>&1 | grep "error TS6133" | while IFS= read -r line; do
    # Extraire le fichier et la variable
    # Format: src/file.tsx(10,5): error TS6133: 'variableName' is declared but its value is never read.

    file=$(echo "$line" | sed -E "s/^([^(]+).*/\1/")
    var_name=$(echo "$line" | sed -E "s/.*'([^']+)'.*/\1/")

    if [[ -f "$file" && -n "$var_name" && "$var_name" != "_"* ]]; then
        echo -e "${YELLOW}Fixing:${NC} $file - $var_name"

        # Cas 1: const { var } = ...
        sed -i '' -E "s/\{ ([^,}]*,)*${var_name}([,}])/{ \1_${var_name}\2/g" "$file"

        # Cas 2: const var = ...
        sed -i '' -E "s/const ${var_name} =/const _${var_name} =/g" "$file"

        # Cas 3: let var = ...
        sed -i '' -E "s/let ${var_name} =/let _${var_name} =/g" "$file"

        # Cas 4: function params
        sed -i '' -E "s/\(([^)]*[, ])${var_name}([,)])/(\1_${var_name}\2/g" "$file"

        # Cas 5: arrow function params
        sed -i '' -E "s/=> \(([^)]*[, ])${var_name}([,)])/=> (\1_${var_name}\2/g" "$file"
    fi
done

echo -e "${GREEN}✅ Terminé ! Vérifiez les changements avec git diff${NC}"

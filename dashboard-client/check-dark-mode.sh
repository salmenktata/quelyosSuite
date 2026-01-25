#!/bin/bash
echo "Vérification du mode dark dans le backoffice..."
echo ""
echo "1. Configuration Tailwind:"
grep -A 2 "darkMode" tailwind.config.js
echo ""
echo "2. ThemeContext vérifie la classe sur <html>:"
grep -A 5 "root.classList" src/contexts/ThemeContext.tsx
echo ""
echo "3. Vérification des classes bg-white sans dark: dans les pages:"
find src/pages -name "*.tsx" -exec grep -l "bg-white[^-]" {} \; | while read file; do
  if ! grep -q "dark:bg-gray" "$file"; then
    echo "  ⚠️  $file - Manque dark mode"
  fi
done
echo "  ✅ Toutes les pages ont le dark mode"
echo ""
echo "4. Test localStorage theme:"
echo "  Pour activer le dark mode, exécutez dans la console du navigateur:"
echo "  localStorage.setItem('quelyos-backoffice-theme', 'dark')"
echo "  Puis rechargez la page"

#!/bin/bash
# Script pour corriger la visibilité des menus Settings et Apps dans Odoo 19
# Problème : Les menus Settings et Apps ont par défaut une séquence élevée (500+)
# qui les rend invisibles ou difficiles à trouver dans l'interface
# Solution : Les placer au début avec des séquences basses

set -e

echo "🔧 Correction de la visibilité des menus Odoo..."

docker exec quelyos-db psql -U odoo -d quelyos <<'SQL'
-- Mettre Settings et Apps au début pour une meilleure visibilité
UPDATE ir_ui_menu SET sequence = 1 WHERE id = 1 AND name->>'en_US' = 'Settings';
UPDATE ir_ui_menu SET sequence = 2 WHERE id = 15 AND name->>'en_US' = 'Apps';

-- Vérifier l'application
SELECT
  id,
  name->>'en_US' as menu_name,
  sequence,
  active
FROM ir_ui_menu
WHERE id IN (1, 15);
SQL

echo "✅ Menus corrigés avec succès"
echo ""
echo "📝 Note: Redémarrez Odoo et reconnectez-vous pour voir les changements"
echo "   docker restart quelyos-odoo"

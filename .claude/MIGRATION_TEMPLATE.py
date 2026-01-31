# -*- coding: utf-8 -*-
"""
TEMPLATE Migration Champ sans Préfixe → x_prefix

Ce fichier est un exemple de migration progressive avec compatibilité ascendante.
À adapter selon le champ à migrer.
"""

# ═══════════════════════════════════════════════════════════════════════════
# ÉTAPE 1 : Modification du Modèle Python
# ═══════════════════════════════════════════════════════════════════════════

from odoo import models, fields, api

class ProductProduct(models.Model):
    _inherit = 'product.product'
    
    # ✅ NOUVEAU champ avec préfixe x_ (stocké en SQL)
    x_qty_reserved_manual = fields.Float(
        string='Quantité réservée manuellement',
        default=0.0,
        help='Stock réservé manuellement (hors commandes)',
        copy=False
    )
    
    # ⚠️ ALIAS pour compatibilité backend (DEPRECATED - sera supprimé Q4 2026)
    # Permet aux endpoints API existants de continuer à fonctionner
    qty_reserved_manual = fields.Float(
        string='[DEPRECATED] Quantité réservée',
        compute='_compute_qty_reserved_manual_alias',
        inverse='_inverse_qty_reserved_manual_alias',
        search='_search_qty_reserved_manual_alias',
        store=False,  # Pas de colonne SQL (juste un alias)
        help='DEPRECATED: Utiliser x_qty_reserved_manual à la place'
    )
    
    def _compute_qty_reserved_manual_alias(self):
        """Lecture backward-compatible via alias"""
        for record in self:
            record.qty_reserved_manual = record.x_qty_reserved_manual
    
    def _inverse_qty_reserved_manual_alias(self):
        """Écriture backward-compatible via alias"""
        for record in self:
            record.x_qty_reserved_manual = record.qty_reserved_manual
    
    def _search_qty_reserved_manual_alias(self, operator, value):
        """Recherche backward-compatible via alias"""
        return [('x_qty_reserved_manual', operator, value)]


# ═══════════════════════════════════════════════════════════════════════════
# ÉTAPE 2 : Script Migration SQL
# ═══════════════════════════════════════════════════════════════════════════

# Créer fichier: odoo-backend/addons/quelyos_api/migrations/19.0.1.42.0/post-migrate.py

def migrate(cr, version):
    """
    Migration progressive : Renommer qty_reserved_manual → x_qty_reserved_manual
    
    Cette migration renomme la colonne SQL sans perte de données.
    L'alias computed field assure la compatibilité des endpoints API.
    """
    import logging
    _logger = logging.getLogger(__name__)
    
    # 1. Vérifier si colonne x_qty_reserved_manual existe déjà
    cr.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='product_product' 
        AND column_name='x_qty_reserved_manual'
    """)
    
    if cr.fetchone():
        _logger.info("Colonne x_qty_reserved_manual existe déjà, skip migration")
        return
    
    # 2. Vérifier si ancienne colonne existe
    cr.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='product_product' 
        AND column_name='qty_reserved_manual'
    """)
    
    if not cr.fetchone():
        _logger.warning("Colonne qty_reserved_manual n'existe pas, skip migration")
        return
    
    # 3. Renommer colonne SQL (opération atomique, pas de downtime)
    _logger.info("Migration qty_reserved_manual → x_qty_reserved_manual")
    cr.execute("""
        ALTER TABLE product_product 
        RENAME COLUMN qty_reserved_manual TO x_qty_reserved_manual
    """)
    
    # 4. Mettre à jour métadonnées Odoo (ir.model.fields)
    cr.execute("""
        UPDATE ir_model_fields 
        SET name='x_qty_reserved_manual' 
        WHERE model='product.product' 
        AND name='qty_reserved_manual'
    """)
    
    _logger.info("Migration terminée avec succès")


# ═══════════════════════════════════════════════════════════════════════════
# ÉTAPE 3 : Tests Post-Migration
# ═══════════════════════════════════════════════════════════════════════════

"""
# Test 1: Vérifier structure SQL
docker exec -it postgres psql -U odoo -d quelyos_db -c "\\d product_product" | grep qty_reserved

# Test 2: Tester lecture via ancien nom (alias)
curl http://localhost:8069/api/products/1 | jq '.qty_reserved_manual'

# Test 3: Tester écriture via nouveau nom
curl -X PATCH http://localhost:8069/api/products/1 \
  -H "Content-Type: application/json" \
  -d '{"x_qty_reserved_manual": 10}'

# Test 4: Vérifier que l'alias fonctionne (écriture)
curl -X PATCH http://localhost:8069/api/products/1 \
  -H "Content-Type: application/json" \
  -d '{"qty_reserved_manual": 15}'
"""


# ═══════════════════════════════════════════════════════════════════════════
# ÉTAPE 4 : Nettoyage (Q4 2026)
# ═══════════════════════════════════════════════════════════════════════════

"""
Après 6-9 mois de dépréciation, supprimer les alias :

1. Supprimer champs computed (qty_reserved_manual + méthodes)
2. Mettre à jour tous les endpoints API → utiliser x_qty_reserved_manual
3. Incrémenter version majeure (19.0.2.0.0)
4. Documenter breaking change dans CHANGELOG
"""

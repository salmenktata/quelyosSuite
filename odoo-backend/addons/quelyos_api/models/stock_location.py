# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from odoo.exceptions import UserError


class StockLocation(models.Model):
    _inherit = 'stock.location'

    # ═══════════════════════════════════════════════════════════════════════════
    # MULTI-TENANT
    # ═══════════════════════════════════════════════════════════════════════════

    tenant_id = fields.Many2one(
        'quelyos.tenant',
        string='Tenant',
        index=True,
        ondelete='cascade',
        help='Tenant propriétaire de cet emplacement',
    )

    x_is_locked = fields.Boolean(
        string='Verrouillée',
        default=False,
        help='Bloquer tous les mouvements stock dans cet emplacement (utilisé durant inventaire)',
    )

    x_lock_reason = fields.Char(
        string='Raison Verrouillage',
        help='Pourquoi cette location est verrouillée',
    )

    x_locked_by_id = fields.Many2one(
        'res.users',
        string='Verrouillée par',
        readonly=True,
    )

    x_locked_date = fields.Datetime(
        string='Date Verrouillage',
        readonly=True,
    )

    def action_lock(self, reason=None):
        """Verrouiller la location"""
        for location in self:
            location.write({
                'x_is_locked': True,
                'x_lock_reason': reason or 'Inventaire en cours',
                'x_locked_by_id': self.env.user.id,
                'x_locked_date': fields.Datetime.now(),
            })

    def action_unlock(self):
        """Déverrouiller la location"""
        for location in self:
            location.write({
                'x_is_locked': False,
                'x_lock_reason': False,
                'x_locked_by_id': False,
                'x_locked_date': False,
            })


class StockMove(models.Model):
    _inherit = 'stock.move'

    @api.constrains('location_id', 'location_dest_id')
    def _check_location_not_locked(self):
        """Empêcher création/modification de mouvements si location verrouillée"""
        for move in self:
            # Autoriser si mouvement déjà fait (done/cancel)
            if move.state in ['done', 'cancel']:
                continue

            # Vérifier location source
            if move.location_id.x_is_locked:
                raise UserError(_(
                    "Impossible de créer un mouvement depuis l'emplacement '{}' car il est verrouillé.\n"
                    "Raison : {}"
                ).format(
                    move.location_id.complete_name,
                    move.location_id.x_lock_reason or 'Non spécifiée'
                ))

            # Vérifier location destination
            if move.location_dest_id.x_is_locked:
                raise UserError(_(
                    "Impossible de créer un mouvement vers l'emplacement '{}' car il est verrouillé.\n"
                    "Raison : {}"
                ).format(
                    move.location_dest_id.complete_name,
                    move.location_dest_id.x_lock_reason or 'Non spécifiée'
                ))

    def _action_done(self, cancel_backorder=False):
        """Override pour vérifier verrouillage avant validation"""
        # Vérifier verrouillage avant de valider
        for move in self:
            if move.location_id.x_is_locked or move.location_dest_id.x_is_locked:
                locked_loc = move.location_id if move.location_id.x_is_locked else move.location_dest_id
                raise UserError(_(
                    "Impossible de valider le mouvement : l'emplacement '{}' est verrouillé.\n"
                    "Raison : {}\n"
                    "Verrouillé par : {} le {}"
                ).format(
                    locked_loc.complete_name,
                    locked_loc.x_lock_reason or 'Non spécifiée',
                    locked_loc.x_locked_by_id.name if locked_loc.x_locked_by_id else 'Inconnu',
                    locked_loc.x_locked_date.strftime('%d/%m/%Y %H:%M') if locked_loc.x_locked_date else ''
                ))

        return super()._action_done(cancel_backorder=cancel_backorder)

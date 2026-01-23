# -*- coding: utf-8 -*-

from odoo import models, fields


class ResConfigSettings(models.TransientModel):
    """Extension de la configuration système pour les paramètres Quelyos Core."""
    _inherit = 'res.config.settings'

    # === Identité de l'entreprise ===
    quelyos_company_name = fields.Char(
        string='Nom de l\'entreprise',
        config_parameter='quelyos.core.company_name',
        help='Nom de votre organisation'
    )

    quelyos_company_url = fields.Char(
        string='Site web',
        config_parameter='quelyos.core.company_url',
        help='URL de votre site web principal'
    )

    quelyos_support_url = fields.Char(
        string='URL Support',
        config_parameter='quelyos.core.support_url',
        help='URL de votre page de support client'
    )

    quelyos_docs_url = fields.Char(
        string='URL Documentation',
        config_parameter='quelyos.core.docs_url',
        help='URL de votre documentation'
    )

    quelyos_contact_email = fields.Char(
        string='Email de contact',
        config_parameter='quelyos.core.contact_email',
        help='Email de contact principal'
    )

    quelyos_copyright_year = fields.Char(
        string='Année Copyright',
        config_parameter='quelyos.core.copyright_year',
        help='Année pour le copyright'
    )

    quelyos_copyright_text = fields.Char(
        string='Texte Copyright',
        config_parameter='quelyos.core.copyright_text',
        help='Texte complet du copyright'
    )

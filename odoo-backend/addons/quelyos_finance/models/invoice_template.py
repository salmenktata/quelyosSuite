# -*- coding: utf-8 -*-
"""
Modèle Template Facture - Personnalisation Branding

Gère templates PDF personnalisés par secteur/entreprise :
- Bibliothèque templates sectoriels (Tech, BTP, Luxe, E-commerce)
- Personnalisation branding (logo, couleurs, footer)
- Variables dynamiques ({company.name}, {invoice.number})
- Preview temps réel
- Export multi-format (PDF, Factur-X, UBL)

Workflow :
1. Client choisit template sectoriel base
2. Client personnalise (logo, couleurs, footer)
3. Preview temps réel avant validation
4. Template sauvegardé pour réutilisation
5. Génération PDF avec template lors émission facture
"""

import logging
import json
from odoo import models, fields, api
from odoo.exceptions import UserError

_logger = logging.getLogger(__name__)


class InvoiceTemplate(models.Model):
    """Template personnalisé facture"""

    _name = 'quelyos.invoice_template'
    _description = 'Template Facture Personnalisé'
    _order = 'sequence, name'

    # Identité
    name = fields.Char(
        string='Nom Template',
        required=True,
        help='Ex: Template Tech Minimal, Template BTP Détaillé'
    )
    code = fields.Char(
        string='Code',
        required=True,
        index=True,
        help='Code unique (ex: tech_minimal, btp_detailed)'
    )

    # Relations
    tenant_id = fields.Many2one(
        'quelyos.tenant',
        string='Tenant',
        index=True,
        help='Si null = template système (bibliothèque), sinon custom client'
    )
    user_id = fields.Many2one(
        'res.users',
        string='Créé par',
        default=lambda self: self.env.user
    )

    # Type & Secteur
    template_type = fields.Selection(
        [
            ('system', 'Système (Bibliothèque)'),
            ('custom', 'Personnalisé Client'),
        ],
        string='Type',
        default='custom',
        required=True
    )
    sector = fields.Selection(
        [
            ('tech', 'Technologie / SaaS'),
            ('ecommerce', 'E-commerce / Retail'),
            ('btp', 'BTP / Construction'),
            ('consulting', 'Conseil / Services'),
            ('luxury', 'Luxe / Premium'),
            ('medical', 'Médical / Santé'),
            ('legal', 'Juridique'),
            ('education', 'Éducation / Formation'),
            ('hospitality', 'Hôtellerie / Restauration'),
            ('other', 'Autre'),
        ],
        string='Secteur',
        default='other'
    )

    # Branding
    logo_url = fields.Char(
        string='URL Logo',
        help='URL logo entreprise (S3, Cloudinary, etc.)'
    )
    primary_color = fields.Char(
        string='Couleur Primaire',
        default='#4F46E5',
        help='Hex color (ex: #4F46E5 = indigo)'
    )
    secondary_color = fields.Char(
        string='Couleur Secondaire',
        default='#10B981',
        help='Hex color pour accents'
    )
    font_family = fields.Selection(
        [
            ('arial', 'Arial (Sans-serif)'),
            ('helvetica', 'Helvetica (Sans-serif)'),
            ('times', 'Times New Roman (Serif)'),
            ('georgia', 'Georgia (Serif)'),
            ('courier', 'Courier New (Monospace)'),
        ],
        string='Police',
        default='helvetica'
    )

    # Layout
    header_content = fields.Html(
        string='Header HTML',
        help='HTML header personnalisé (logo, coordonnées entreprise)'
    )
    footer_content = fields.Html(
        string='Footer HTML',
        help='HTML footer personnalisé (mentions légales, IBAN, etc.)'
    )
    custom_css = fields.Text(
        string='CSS Personnalisé',
        help='CSS additionnel pour styling avancé'
    )

    # Variables disponibles
    available_variables = fields.Text(
        string='Variables Disponibles',
        compute='_compute_available_variables',
        help='Liste variables dynamiques utilisables'
    )

    # Configuration
    show_logo = fields.Boolean(string='Afficher Logo', default=True)
    show_company_info = fields.Boolean(string='Afficher Infos Entreprise', default=True)
    show_bank_details = fields.Boolean(string='Afficher IBAN', default=True)
    show_payment_terms = fields.Boolean(string='Afficher Conditions Paiement', default=True)
    show_tax_breakdown = fields.Boolean(string='Détailler TVA', default=True)

    # Métadonnées
    sequence = fields.Integer(string='Ordre', default=10)
    active = fields.Boolean(string='Actif', default=True)
    is_default = fields.Boolean(
        string='Template par défaut',
        default=False,
        help='Utilisé automatiquement si aucun template choisi'
    )
    preview_url = fields.Char(
        string='URL Preview',
        compute='_compute_preview_url',
        help='URL preview PDF template'
    )

    # Stats
    usage_count = fields.Integer(
        string='Utilisations',
        default=0,
        readonly=True,
        help='Nombre factures générées avec ce template'
    )

    # Contraintes
    _sql_constraints = [
        (
            'unique_code_tenant',
            'UNIQUE(code, tenant_id)',
            'Un template avec ce code existe déjà pour ce tenant'
        )
    ]

    @api.depends('code')
    def _compute_available_variables(self):
        """Liste variables dynamiques disponibles"""
        variables = {
            'company': {
                'name': 'Nom entreprise',
                'vat': 'N° TVA',
                'street': 'Adresse rue',
                'zip': 'Code postal',
                'city': 'Ville',
                'country': 'Pays',
                'phone': 'Téléphone',
                'email': 'Email',
                'website': 'Site web',
            },
            'invoice': {
                'number': 'N° facture',
                'date': 'Date facture',
                'due_date': 'Date échéance',
                'amount_untaxed': 'Montant HT',
                'amount_tax': 'Montant TVA',
                'amount_total': 'Montant TTC',
                'payment_reference': 'Référence paiement',
            },
            'customer': {
                'name': 'Nom client',
                'vat': 'N° TVA client',
                'address': 'Adresse complète',
                'phone': 'Téléphone client',
                'email': 'Email client',
            },
        }

        import json
        for record in self:
            record.available_variables = json.dumps(variables, indent=2, ensure_ascii=False)

    @api.depends('code', 'tenant_id')
    def _compute_preview_url(self):
        """URL preview PDF template"""
        for record in self:
            if record.id:
                # TODO: Générer preview PDF
                record.preview_url = f"/api/finance/invoices/template/{record.id}/preview"
            else:
                record.preview_url = None

    @api.model
    def get_default_template(self, tenant_id):
        """
        Récupérer template par défaut pour un tenant

        Args:
            tenant_id (int): ID tenant

        Returns:
            quelyos.invoice_template: Template par défaut
        """
        # Chercher template custom par défaut
        template = self.search([
            ('tenant_id', '=', tenant_id),
            ('is_default', '=', True),
            ('active', '=', True),
        ], limit=1)

        if template:
            return template

        # Fallback : template système par défaut
        template = self.search([
            ('tenant_id', '=', False),
            ('template_type', '=', 'system'),
            ('is_default', '=', True),
            ('active', '=', True),
        ], limit=1)

        return template

    @api.model
    def get_system_templates(self):
        """
        Récupérer bibliothèque templates système

        Returns:
            list: Templates système par secteur
        """
        templates = self.search([
            ('tenant_id', '=', False),
            ('template_type', '=', 'system'),
            ('active', '=', True),
        ], order='sector, sequence')

        return [{
            'id': t.id,
            'name': t.name,
            'code': t.code,
            'sector': t.sector,
            'primary_color': t.primary_color,
            'secondary_color': t.secondary_color,
            'preview_url': t.preview_url,
        } for t in templates]

    def action_set_as_default(self):
        """Définir comme template par défaut"""
        self.ensure_one()

        # Désactiver autres defaults pour ce tenant
        other_defaults = self.search([
            ('tenant_id', '=', self.tenant_id.id if self.tenant_id else False),
            ('is_default', '=', True),
            ('id', '!=', self.id),
        ])
        other_defaults.write({'is_default': False})

        # Activer celui-ci
        self.write({'is_default': True})

        _logger.info(f"Template {self.name} défini comme défaut pour tenant {self.tenant_id.id if self.tenant_id else 'system'}")

    def action_duplicate(self):
        """Dupliquer template pour personnalisation"""
        self.ensure_one()

        new_template = self.copy({
            'name': f"{self.name} (Copie)",
            'code': f"{self.code}_copy_{self.env.user.id}",
            'template_type': 'custom',
            'tenant_id': self.env.user.tenant_id.id,
            'is_default': False,
            'usage_count': 0,
        })

        _logger.info(f"Template {self.name} dupliqué → {new_template.name}")

        return {
            'type': 'ir.actions.act_window',
            'res_model': 'quelyos.invoice_template',
            'res_id': new_template.id,
            'view_mode': 'form',
            'target': 'current',
        }

    def render_invoice_pdf(self, invoice):
        """
        Générer PDF facture avec ce template

        Args:
            invoice: Recordset account.move

        Returns:
            bytes: Contenu PDF
        """
        self.ensure_one()

        # Préparer contexte variables
        context = self._prepare_invoice_context(invoice)

        # Générer HTML depuis template
        html = self._render_html_template(context)

        # Convertir HTML → PDF (wkhtmltopdf ou reportlab)
        pdf_content = self._html_to_pdf(html)

        # Incrémenter usage_count
        self.sudo().write({'usage_count': self.usage_count + 1})

        _logger.info(f"PDF généré avec template {self.name} pour facture {invoice.name}")

        return pdf_content

    def _prepare_invoice_context(self, invoice):
        """Préparer contexte variables pour template"""
        company = invoice.company_id
        partner = invoice.partner_id

        return {
            'company': {
                'name': company.name,
                'vat': company.vat or '',
                'street': company.street or '',
                'zip': company.zip or '',
                'city': company.city or '',
                'country': company.country_id.name if company.country_id else '',
                'phone': company.phone or '',
                'email': company.email or '',
                'website': company.website or '',
            },
            'invoice': {
                'number': invoice.name,
                'date': invoice.invoice_date.strftime('%d/%m/%Y') if invoice.invoice_date else '',
                'due_date': invoice.invoice_date_due.strftime('%d/%m/%Y') if invoice.invoice_date_due else '',
                'amount_untaxed': f"{invoice.amount_untaxed:.2f}",
                'amount_tax': f"{invoice.amount_tax:.2f}",
                'amount_total': f"{invoice.amount_total:.2f}",
                'currency': invoice.currency_id.symbol,
                'payment_reference': invoice.payment_reference or '',
                'lines': [{
                    'description': line.name,
                    'quantity': line.quantity,
                    'unit_price': f"{line.price_unit:.2f}",
                    'tax_rate': f"{line.tax_ids[0].amount:.0f}" if line.tax_ids else '0',
                    'subtotal': f"{line.price_subtotal:.2f}",
                } for line in invoice.invoice_line_ids],
            },
            'customer': {
                'name': partner.name,
                'vat': partner.vat or '',
                'address': f"{partner.street or ''}\n{partner.zip or ''} {partner.city or ''}",
                'phone': partner.phone or '',
                'email': partner.email or '',
            },
            'template': {
                'logo_url': self.logo_url or '',
                'primary_color': self.primary_color,
                'secondary_color': self.secondary_color,
            },
        }

    def _render_html_template(self, context):
        """Générer HTML depuis template + contexte"""
        # Template HTML de base
        html_template = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: {self.font_family}, sans-serif; margin: 0; padding: 20px; }}
                .header {{ border-bottom: 2px solid {self.primary_color}; padding-bottom: 20px; }}
                .footer {{ border-top: 1px solid #ccc; padding-top: 20px; margin-top: 40px; font-size: 12px; }}
                .invoice-title {{ color: {self.primary_color}; font-size: 28px; font-weight: bold; }}
                table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
                th {{ background: {self.primary_color}; color: white; padding: 10px; text-align: left; }}
                td {{ padding: 10px; border-bottom: 1px solid #eee; }}
                .total {{ background: {self.secondary_color}; color: white; font-weight: bold; }}
                {self.custom_css or ''}
            </style>
        </head>
        <body>
            <div class="header">
                {self.header_content or self._default_header(context)}
            </div>

            <div class="invoice-body">
                <h1 class="invoice-title">Facture {context['invoice']['number']}</h1>

                <div style="margin: 20px 0;">
                    <strong>Client:</strong><br>
                    {context['customer']['name']}<br>
                    {context['customer']['address']}<br>
                    {context['customer']['email']}
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Quantité</th>
                            <th>Prix Unitaire</th>
                            <th>TVA</th>
                            <th>Sous-total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {''.join([f'''
                        <tr>
                            <td>{line['description']}</td>
                            <td>{line['quantity']}</td>
                            <td>{line['unit_price']} {context['invoice']['currency']}</td>
                            <td>{line['tax_rate']}%</td>
                            <td>{line['subtotal']} {context['invoice']['currency']}</td>
                        </tr>
                        ''' for line in context['invoice']['lines']])}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="4" style="text-align: right;"><strong>Total HT:</strong></td>
                            <td>{context['invoice']['amount_untaxed']} {context['invoice']['currency']}</td>
                        </tr>
                        <tr>
                            <td colspan="4" style="text-align: right;"><strong>TVA:</strong></td>
                            <td>{context['invoice']['amount_tax']} {context['invoice']['currency']}</td>
                        </tr>
                        <tr class="total">
                            <td colspan="4" style="text-align: right;"><strong>Total TTC:</strong></td>
                            <td>{context['invoice']['amount_total']} {context['invoice']['currency']}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div class="footer">
                {self.footer_content or self._default_footer(context)}
            </div>
        </body>
        </html>
        """

        return html_template

    def _default_header(self, context):
        """Header par défaut si non personnalisé"""
        return f"""
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
                <h2>{context['company']['name']}</h2>
                <p>{context['company']['street']}<br>
                {context['company']['zip']} {context['company']['city']}<br>
                TVA: {context['company']['vat']}</p>
            </div>
            <div style="text-align: right;">
                <p>Date: {context['invoice']['date']}<br>
                Échéance: {context['invoice']['due_date']}</p>
            </div>
        </div>
        """

    def _default_footer(self, context):
        """Footer par défaut si non personnalisé"""
        return f"""
        <p style="text-align: center; color: #666;">
            {context['company']['name']} - {context['company']['email']} - {context['company']['phone']}<br>
            TVA: {context['company']['vat']} - RCS: {context['company']['name']}
        </p>
        """

    def _html_to_pdf(self, html):
        """
        Convertir HTML → PDF

        Args:
            html (str): HTML content

        Returns:
            bytes: PDF content
        """
        # TODO: Implémenter conversion HTML → PDF
        # Option 1 : wkhtmltopdf (externe)
        # Option 2 : reportlab (Python)
        # Option 3 : WeasyPrint (Python, CSS complet)

        _logger.info("Conversion HTML → PDF (TODO: implémenter)")

        return b"PDF_PLACEHOLDER"

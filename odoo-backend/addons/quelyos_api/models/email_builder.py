# -*- coding: utf-8 -*-
"""
Email Builder Model - Fonctionnalité Premium Enterprise

Équivalent Odoo Enterprise Marketing Automation Email Builder (payant)
mais gratuit dans Quelyos Suite.

Éditeur drag & drop pour créer des emails marketing professionnels :
- Blocs réutilisables (header, texte, image, bouton, produit, footer)
- Templates responsive (desktop, mobile, tablet)
- Variables dynamiques
- Prévisualisation multi-devices
- Export HTML optimisé
"""

from odoo import models, fields, api, _
from odoo.exceptions import ValidationError
import json
import re


class EmailBuilder(models.Model):
    _name = 'quelyos.email.builder'
    _description = 'Email Builder (Premium)'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'write_date desc, id desc'

    name = fields.Char(
        string='Nom Template',
        required=True,
        tracking=True,
        help='Nom descriptif du template email'
    )

    category = fields.Selection([
        ('welcome', 'Bienvenue'),
        ('newsletter', 'Newsletter'),
        ('promo', 'Promotion'),
        ('ecommerce', 'E-commerce'),
        ('transactional', 'Transactionnel'),
        ('cart_reminder', 'Relance Panier'),
        ('loyalty', 'Fidélité'),
        ('custom', 'Personnalisé'),
    ], string='Catégorie', default='newsletter', required=True, tracking=True)

    subject = fields.Char(
        string='Objet Email',
        required=True,
        help='Objet de l\'email (supporte variables dynamiques)'
    )

    preview_text = fields.Char(
        string='Texte Prévisualisation',
        help='Texte affiché dans la prévisualisation de la boîte mail (max 100 caractères)'
    )

    # ═══════════════════════════════════════════════════════════════════════════
    # STRUCTURE EMAIL (JSON)
    # ═══════════════════════════════════════════════════════════════════════════

    blocks_json = fields.Text(
        string='Structure Email (JSON)',
        required=True,
        default='[]',
        help='Structure des blocs email au format JSON'
    )

    blocks_count = fields.Integer(
        string='Nombre Blocs',
        compute='_compute_blocks_count',
        store=True,
        help='Nombre total de blocs dans le template'
    )

    # ═══════════════════════════════════════════════════════════════════════════
    # RENDU HTML
    # ═══════════════════════════════════════════════════════════════════════════

    html_content = fields.Html(
        string='HTML Final',
        compute='_compute_html_content',
        help='Code HTML final généré à partir des blocs'
    )

    # ═══════════════════════════════════════════════════════════════════════════
    # CONFIGURATION
    # ═══════════════════════════════════════════════════════════════════════════

    primary_color = fields.Char(
        string='Couleur Primaire',
        default='#4F46E5',
        help='Couleur principale du template (hex)'
    )

    secondary_color = fields.Char(
        string='Couleur Secondaire',
        default='#10B981',
        help='Couleur secondaire du template (hex)'
    )

    font_family = fields.Selection([
        ('Arial, sans-serif', 'Arial'),
        ('Helvetica, sans-serif', 'Helvetica'),
        ('Georgia, serif', 'Georgia'),
        ('Times New Roman, serif', 'Times'),
        ('Verdana, sans-serif', 'Verdana'),
        ('system-ui, sans-serif', 'Système'),
    ], string='Police', default='Arial, sans-serif')

    max_width = fields.Integer(
        string='Largeur Max',
        default=600,
        help='Largeur maximale du template en pixels (recommandé: 600px)'
    )

    # ═══════════════════════════════════════════════════════════════════════════
    # STATISTIQUES
    # ═══════════════════════════════════════════════════════════════════════════

    usage_count = fields.Integer(
        string='Utilisations',
        default=0,
        help='Nombre de fois que ce template a été utilisé'
    )

    last_used_date = fields.Datetime(
        string='Dernière Utilisation',
        readonly=True
    )

    # ═══════════════════════════════════════════════════════════════════════════
    # MÉTADONNÉES
    # ═══════════════════════════════════════════════════════════════════════════

    active = fields.Boolean(
        string='Actif',
        default=True
    )

    is_template = fields.Boolean(
        string='Template Système',
        default=False,
        help='Template système (non modifiable par utilisateur)'
    )

    company_id = fields.Many2one(
        'res.company',
        string='Société',
        default=lambda self: self.env.company
    )

    # ═══════════════════════════════════════════════════════════════════════════
    # COMPUTED FIELDS
    # ═══════════════════════════════════════════════════════════════════════════

    @api.depends('blocks_json')
    def _compute_blocks_count(self):
        """Calcul du nombre de blocs"""
        for builder in self:
            try:
                blocks = json.loads(builder.blocks_json)
                builder.blocks_count = len(blocks) if isinstance(blocks, list) else 0
            except (json.JSONDecodeError, TypeError):
                builder.blocks_count = 0

    @api.depends('blocks_json', 'primary_color', 'secondary_color', 'font_family', 'max_width')
    def _compute_html_content(self):
        """Génère le HTML final à partir des blocs"""
        for builder in self:
            builder.html_content = builder._render_html()

    # ═══════════════════════════════════════════════════════════════════════════
    # VALIDATION
    # ═══════════════════════════════════════════════════════════════════════════

    @api.constrains('blocks_json')
    def _check_blocks_json_valid(self):
        """Validation : JSON doit être valide"""
        for builder in self:
            try:
                blocks = json.loads(builder.blocks_json)
                if not isinstance(blocks, list):
                    raise ValidationError(_("La structure des blocs doit être une liste JSON"))
            except json.JSONDecodeError as e:
                raise ValidationError(_("JSON invalide : %s") % str(e))

    @api.constrains('primary_color', 'secondary_color')
    def _check_colors_format(self):
        """Validation : couleurs doivent être au format hex"""
        hex_pattern = re.compile(r'^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$')
        for builder in self:
            if builder.primary_color and not hex_pattern.match(builder.primary_color):
                raise ValidationError(_("Couleur primaire invalide (format hex requis : #RRGGBB)"))
            if builder.secondary_color and not hex_pattern.match(builder.secondary_color):
                raise ValidationError(_("Couleur secondaire invalide (format hex requis : #RRGGBB)"))

    @api.constrains('max_width')
    def _check_max_width(self):
        """Validation : largeur max entre 400 et 800px"""
        for builder in self:
            if not (400 <= builder.max_width <= 800):
                raise ValidationError(_("Largeur max doit être entre 400 et 800 pixels"))

    # ═══════════════════════════════════════════════════════════════════════════
    # BUSINESS METHODS
    # ═══════════════════════════════════════════════════════════════════════════

    def _render_html(self):
        """
        Génère le code HTML complet de l'email à partir des blocs.

        Retourne un HTML responsive compatible avec tous les clients email.
        """
        self.ensure_one()

        try:
            blocks = json.loads(self.blocks_json)
        except (json.JSONDecodeError, TypeError):
            blocks = []

        # CSS inline pour compatibilité email
        html_parts = [
            f'<!DOCTYPE html>',
            f'<html lang="fr">',
            f'<head>',
            f'  <meta charset="UTF-8">',
            f'  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
            f'  <title>{self.subject or "Email"}</title>',
            f'  <!--[if mso]>',
            f'  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>',
            f'  <![endif]-->',
            f'</head>',
            f'<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:{self.font_family};">',
            f'  <!-- Preview Text -->',
            f'  <div style="display:none;max-height:0;overflow:hidden;">',
            f'    {self.preview_text or ""}',
            f'  </div>',
            f'  <!-- Container -->',
            f'  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f3f4f6;">',
            f'    <tr>',
            f'      <td align="center" style="padding:20px 0;">',
            f'        <!-- Email Content -->',
            f'        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="{self.max_width}" style="max-width:{self.max_width}px;background-color:#ffffff;border-radius:8px;overflow:hidden;">',
        ]

        # Générer HTML pour chaque bloc
        for block in blocks:
            block_html = self._render_block(block)
            if block_html:
                html_parts.append(block_html)

        # Fermeture
        html_parts.extend([
            f'        </table>',
            f'      </td>',
            f'    </tr>',
            f'  </table>',
            f'</body>',
            f'</html>',
        ])

        return '\n'.join(html_parts)

    def _render_block(self, block):
        """Génère le HTML d'un bloc spécifique"""
        block_type = block.get('type')

        if block_type == 'header':
            return self._render_header_block(block)
        elif block_type == 'text':
            return self._render_text_block(block)
        elif block_type == 'image':
            return self._render_image_block(block)
        elif block_type == 'button':
            return self._render_button_block(block)
        elif block_type == 'product':
            return self._render_product_block(block)
        elif block_type == 'divider':
            return self._render_divider_block(block)
        elif block_type == 'footer':
            return self._render_footer_block(block)
        elif block_type == 'spacer':
            return self._render_spacer_block(block)
        else:
            return ''

    def _render_header_block(self, block):
        """Bloc Header avec logo et titre"""
        logo_url = block.get('logo_url', '')
        title = block.get('title', '')
        subtitle = block.get('subtitle', '')
        bg_color = block.get('bg_color', self.primary_color)

        return f'''
          <tr>
            <td style="padding:40px 30px;background-color:{bg_color};text-align:center;">
              {f'<img src="{logo_url}" alt="Logo" style="max-width:200px;height:auto;margin-bottom:20px;" />' if logo_url else ''}
              {f'<h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">{title}</h1>' if title else ''}
              {f'<p style="margin:10px 0 0;color:#e5e7eb;font-size:16px;">{subtitle}</p>' if subtitle else ''}
            </td>
          </tr>
        '''

    def _render_text_block(self, block):
        """Bloc Texte"""
        content = block.get('content', '')
        align = block.get('align', 'left')

        return f'''
          <tr>
            <td style="padding:30px;text-align:{align};color:#1f2937;font-size:16px;line-height:1.6;">
              {content}
            </td>
          </tr>
        '''

    def _render_image_block(self, block):
        """Bloc Image"""
        image_url = block.get('image_url', '')
        alt_text = block.get('alt_text', 'Image')
        link_url = block.get('link_url', '')
        width = block.get('width', '100%')

        img_html = f'<img src="{image_url}" alt="{alt_text}" style="max-width:100%;width:{width};height:auto;display:block;margin:0 auto;" />'

        if link_url:
            img_html = f'<a href="{link_url}" style="text-decoration:none;">{img_html}</a>'

        return f'''
          <tr>
            <td style="padding:20px;">
              {img_html}
            </td>
          </tr>
        '''

    def _render_button_block(self, block):
        """Bloc Bouton CTA"""
        text = block.get('text', 'Cliquez ici')
        url = block.get('url', '#')
        bg_color = block.get('bg_color', self.primary_color)
        text_color = block.get('text_color', '#ffffff')
        align = block.get('align', 'center')

        return f'''
          <tr>
            <td style="padding:30px;text-align:{align};">
              <a href="{url}" style="display:inline-block;background-color:{bg_color};color:{text_color};padding:16px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">
                {text}
              </a>
            </td>
          </tr>
        '''

    def _render_product_block(self, block):
        """Bloc Produit (image + titre + prix + bouton)"""
        product_name = block.get('product_name', '')
        product_image = block.get('product_image', '')
        product_price = block.get('product_price', '')
        product_url = block.get('product_url', '#')
        button_text = block.get('button_text', 'Acheter')

        return f'''
          <tr>
            <td style="padding:30px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align:center;">
                    {f'<img src="{product_image}" alt="{product_name}" style="max-width:300px;height:auto;border-radius:8px;margin-bottom:15px;" />' if product_image else ''}
                    {f'<h3 style="margin:0 0 10px;color:#1f2937;font-size:20px;">{product_name}</h3>' if product_name else ''}
                    {f'<p style="margin:0 0 20px;color:{self.primary_color};font-size:24px;font-weight:700;">{product_price}</p>' if product_price else ''}
                    <a href="{product_url}" style="display:inline-block;background-color:{self.primary_color};color:#ffffff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:600;">
                      {button_text}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        '''

    def _render_divider_block(self, block):
        """Bloc Séparateur"""
        color = block.get('color', '#e5e7eb')
        height = block.get('height', 1)

        return f'''
          <tr>
            <td style="padding:20px 30px;">
              <hr style="border:none;border-top:{height}px solid {color};margin:0;" />
            </td>
          </tr>
        '''

    def _render_footer_block(self, block):
        """Bloc Footer"""
        content = block.get('content', '')
        bg_color = block.get('bg_color', '#f9fafb')
        text_color = block.get('text_color', '#6b7280')

        return f'''
          <tr>
            <td style="padding:30px;background-color:{bg_color};text-align:center;color:{text_color};font-size:14px;line-height:1.6;">
              {content}
            </td>
          </tr>
        '''

    def _render_spacer_block(self, block):
        """Bloc Espace vide"""
        height = block.get('height', 30)

        return f'''
          <tr>
            <td style="height:{height}px;"></td>
          </tr>
        '''

    def render_with_data(self, partner=None, order=None, product=None, custom_vars=None):
        """
        Génère le HTML final avec variables dynamiques remplacées.

        Args:
            partner: res.partner
            order: sale.order
            product: product.product
            custom_vars: dict de variables supplémentaires

        Returns:
            str: HTML complet avec variables remplacées
        """
        self.ensure_one()

        html = self._render_html()

        # Remplacer variables dans HTML
        if partner:
            html = html.replace('{{partner.name}}', partner.name or '')
            html = html.replace('{{partner.email}}', partner.email or '')

        if order:
            html = html.replace('{{order.name}}', order.name or '')
            html = html.replace('{{order.total}}', f"{order.amount_total:.2f}€" if order.amount_total else '0€')

        if product:
            html = html.replace('{{product.name}}', product.name or '')
            html = html.replace('{{product.price}}', f"{product.list_price:.2f}€" if product.list_price else '0€')

        html = html.replace('{{company.name}}', self.env.company.name or '')

        if custom_vars:
            for key, value in custom_vars.items():
                html = html.replace(f'{{{{{key}}}}}', str(value))

        return html

    def increment_usage(self):
        """Incrémenter compteur d'utilisation"""
        for builder in self:
            builder.write({
                'usage_count': builder.usage_count + 1,
                'last_used_date': fields.Datetime.now(),
            })

    def action_duplicate(self):
        """Dupliquer le template"""
        self.ensure_one()
        return self.copy({
            'name': f"{self.name} (copie)",
            'is_template': False,
            'usage_count': 0,
            'last_used_date': False,
        })

    def to_dict(self):
        """Sérialisation pour API"""
        return {
            'id': self.id,
            'name': self.name,
            'category': self.category,
            'subject': self.subject,
            'preview_text': self.preview_text or '',
            'blocks_json': self.blocks_json,
            'blocks_count': self.blocks_count,
            'primary_color': self.primary_color,
            'secondary_color': self.secondary_color,
            'font_family': self.font_family,
            'max_width': self.max_width,
            'usage_count': self.usage_count,
            'last_used_date': self.last_used_date.isoformat() if self.last_used_date else None,
            'created_at': self.create_date.isoformat() if self.create_date else None,
        }

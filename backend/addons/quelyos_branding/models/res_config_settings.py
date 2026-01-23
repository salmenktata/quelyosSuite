# -*- coding: utf-8 -*-

from odoo import models, fields, api
from odoo.exceptions import ValidationError
import base64
import io


class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    # ========================================
    # Champs de configuration du branding
    # ========================================

    quelyos_branding_company_name = fields.Char(
        string='Nom de l\'entreprise',
        config_parameter='quelyos.branding.company_name',
        default='Quelyos',
        help='Nom de l\'entreprise affiché dans l\'interface'
    )

    quelyos_branding_company_url = fields.Char(
        string='URL du site web',
        config_parameter='quelyos.branding.company_url',
        default='https://quelyos.com',
        help='URL du site web de l\'entreprise'
    )

    quelyos_branding_support_url = fields.Char(
        string='URL du support',
        config_parameter='quelyos.branding.support_url',
        default='https://support.quelyos.com',
        help='URL de la page de support'
    )

    quelyos_branding_docs_url = fields.Char(
        string='URL de la documentation',
        config_parameter='quelyos.branding.docs_url',
        default='https://docs.quelyos.com',
        help='URL de la documentation'
    )

    quelyos_branding_primary_color = fields.Char(
        string='Couleur principale',
        config_parameter='quelyos.branding.primary_color',
        default='#1e40af',
        help='Couleur principale en format hexadécimal (ex: #1e40af)'
    )

    quelyos_branding_secondary_color = fields.Char(
        string='Couleur secondaire',
        config_parameter='quelyos.branding.secondary_color',
        default='#10b981',
        help='Couleur secondaire en format hexadécimal (ex: #10b981)'
    )

    quelyos_branding_slogan = fields.Char(
        string='Slogan',
        config_parameter='quelyos.branding.slogan',
        default='La plateforme SaaS omnicanal pour le retail',
        help='Slogan affiché sur la page de connexion et le site web'
    )

    quelyos_branding_contact_email = fields.Char(
        string='Email de contact',
        config_parameter='quelyos.branding.contact_email',
        default='contact@quelyos.com',
        help='Email de contact affiché dans le footer'
    )

    quelyos_branding_show_logo_email = fields.Boolean(
        string='Afficher le logo dans les emails',
        config_parameter='quelyos.branding.show_logo_email',
        default=True,
        help='Afficher le logo Quelyos dans les emails'
    )

    quelyos_branding_email_footer_text = fields.Char(
        string='Texte du footer des emails',
        config_parameter='quelyos.branding.email_footer_text',
        default='Envoyé par Quelyos - La plateforme retail omnicanal',
        help='Texte affiché dans le footer des emails'
    )

    quelyos_branding_powered_by_text = fields.Char(
        string='Texte "Powered by"',
        config_parameter='quelyos.branding.powered_by_text',
        default='Powered by Quelyos',
        help='Texte "Powered by" affiché dans le footer'
    )

    quelyos_branding_copyright_text = fields.Char(
        string='Texte du copyright',
        config_parameter='quelyos.branding.copyright_text',
        default='© 2026 Quelyos - Tous droits réservés',
        help='Texte du copyright affiché dans le footer'
    )

    quelyos_branding_enable_full_debranding = fields.Boolean(
        string='Activer le debranding complet',
        config_parameter='quelyos.branding.enable_full_debranding',
        default=True,
        help='Activer la suppression complète de toutes les références Odoo'
    )

    quelyos_branding_replace_odoo_text = fields.Boolean(
        string='Remplacer les textes "Odoo"',
        config_parameter='quelyos.branding.replace_odoo_text',
        default=True,
        help='Remplacer automatiquement les textes "Odoo" par "Quelyos" dans l\'interface'
    )

    # Champs pour les chemins des assets
    quelyos_branding_favicon_path = fields.Char(
        string='Chemin du favicon',
        config_parameter='quelyos.branding.favicon_path',
        default='/quelyos_branding/static/src/img/favicon/favicon.ico',
        help='Chemin vers le fichier favicon'
    )

    quelyos_branding_logo_navbar_path = fields.Char(
        string='Chemin du logo navbar',
        config_parameter='quelyos.branding.logo_navbar_path',
        default='/quelyos_branding/static/src/img/logo/quelyos_logo_white.png',
        help='Chemin vers le logo affiché dans la navbar'
    )

    quelyos_branding_logo_email_path = fields.Char(
        string='Chemin du logo email',
        config_parameter='quelyos.branding.logo_email_path',
        default='/quelyos_branding/static/src/img/logo/quelyos_logo.png',
        help='Chemin vers le logo affiché dans les emails'
    )

    quelyos_branding_logo_login_path = fields.Char(
        string='Chemin du logo login',
        config_parameter='quelyos.branding.logo_login_path',
        default='/quelyos_branding/static/src/img/logo/quelyos_logo_white.png',
        help='Chemin vers le logo affiché sur la page de connexion'
    )

    quelyos_branding_login_bg_path = fields.Char(
        string='Chemin du background login',
        config_parameter='quelyos.branding.login_bg_path',
        default='/quelyos_branding/static/src/img/backgrounds/login_bg.jpg',
        help='Chemin vers l\'image de fond de la page de connexion'
    )

    # ========================================
    # Champs pour l'upload de logos (Binary)
    # ========================================

    quelyos_branding_logo_main = fields.Binary(
        string='Logo Principal',
        help='Logo principal (recommandé: 1000x250px, PNG/SVG, max 2MB)',
        attachment=True
    )

    quelyos_branding_logo_white = fields.Binary(
        string='Logo Blanc (Navbar)',
        help='Logo blanc pour navbar (recommandé: 1000x250px, PNG/SVG, max 2MB)',
        attachment=True
    )

    quelyos_branding_logo_small = fields.Binary(
        string='Logo Petit',
        help='Logo petit pour emails/receipts (recommandé: 180x46px, PNG, max 1MB)',
        attachment=True
    )

    quelyos_branding_logo_email = fields.Binary(
        string='Logo Email',
        help='Logo pour templates email (recommandé: 600x150px, PNG, max 1MB)',
        attachment=True
    )

    quelyos_branding_favicon = fields.Binary(
        string='Favicon',
        help='Icône favicon (recommandé: 32x32px, ICO/PNG, max 500KB)',
        attachment=True
    )

    # ========================================
    # Champs computed pour statistiques
    # ========================================

    quelyos_branding_module_version = fields.Char(
        string='Version du module',
        compute='_compute_module_info',
        store=False
    )

    quelyos_branding_active_since = fields.Date(
        string='Actif depuis',
        compute='_compute_module_info',
        store=False
    )

    quelyos_branding_custom_logos = fields.Integer(
        string='Nombre de logos personnalisés',
        compute='_compute_custom_logos',
        store=False
    )

    # ========================================
    # Méthodes de validation des images
    # ========================================

    @api.onchange('quelyos_branding_logo_main', 'quelyos_branding_logo_white')
    def _onchange_logo_main(self):
        """Validate main and white logos."""
        if self.quelyos_branding_logo_main:
            self._validate_image(
                self.quelyos_branding_logo_main,
                max_size_mb=2,
                allowed_formats=['png', 'jpg', 'jpeg', 'svg']
            )
        if self.quelyos_branding_logo_white:
            self._validate_image(
                self.quelyos_branding_logo_white,
                max_size_mb=2,
                allowed_formats=['png', 'jpg', 'jpeg', 'svg']
            )

    @api.onchange('quelyos_branding_logo_small', 'quelyos_branding_logo_email')
    def _onchange_logo_small_email(self):
        """Validate small and email logos."""
        if self.quelyos_branding_logo_small:
            self._validate_image(
                self.quelyos_branding_logo_small,
                max_size_mb=1,
                allowed_formats=['png', 'jpg', 'jpeg']
            )
        if self.quelyos_branding_logo_email:
            self._validate_image(
                self.quelyos_branding_logo_email,
                max_size_mb=1,
                allowed_formats=['png', 'jpg', 'jpeg']
            )

    @api.onchange('quelyos_branding_favicon')
    def _onchange_favicon(self):
        """Validate favicon."""
        if self.quelyos_branding_favicon:
            self._validate_image(
                self.quelyos_branding_favicon,
                max_size_mb=0.5,
                allowed_formats=['ico', 'png']
            )

    def _validate_image(self, image_data, max_size_mb=2, allowed_formats=None):
        """
        Validate uploaded image - OPTIMISÉ pour performances.

        Args:
            image_data: Binary image data
            max_size_mb: Maximum file size in MB
            allowed_formats: List of allowed extensions

        Raises:
            ValidationError: If validation fails
        """
        if not image_data:
            return

        # Decode base64 (fast)
        try:
            image_bytes = base64.b64decode(image_data)
        except Exception:
            raise ValidationError("Format d'image invalide")

        # Check file size (fast - no I/O)
        size_mb = len(image_bytes) / (1024 * 1024)
        if size_mb > max_size_mb:
            raise ValidationError(f"L'image est trop volumineuse (max {max_size_mb}MB, taille: {size_mb:.2f}MB)")

        # Check format - Validation rapide par signatures de fichiers (magic bytes)
        if allowed_formats:
            # Détection rapide par magic bytes (plus rapide que PIL)
            file_signature = image_bytes[:20]  # Lire seulement les premiers bytes

            # SVG detection (fast)
            is_svg = (file_signature[:5] == b'<?xml' or
                     file_signature[:4] == b'<svg' or
                     b'<svg' in image_bytes[:100])

            if 'svg' in allowed_formats and is_svg:
                return  # SVG is valid

            # PNG detection (fast)
            is_png = file_signature[:8] == b'\x89PNG\r\n\x1a\n'

            # JPEG detection (fast)
            is_jpeg = file_signature[:3] == b'\xff\xd8\xff'

            # ICO detection (fast)
            is_ico = file_signature[:4] == b'\x00\x00\x01\x00'

            # Validation rapide sans PIL
            valid = False
            if 'png' in allowed_formats and is_png:
                valid = True
            elif ('jpg' in allowed_formats or 'jpeg' in allowed_formats) and is_jpeg:
                valid = True
            elif 'ico' in allowed_formats and is_ico:
                valid = True
            elif 'svg' in allowed_formats and is_svg:
                valid = True

            if not valid:
                # Fallback à PIL seulement si nécessaire (slower)
                try:
                    from PIL import Image
                    img = Image.open(io.BytesIO(image_bytes))
                    format_lower = img.format.lower() if img.format else ''
                    if format_lower not in allowed_formats:
                        raise ValidationError(
                            f"Format non autorisé. Formats acceptés: {', '.join(allowed_formats).upper()}"
                        )
                except ImportError:
                    # PIL not available, validation déjà faite avec magic bytes
                    if not valid:
                        raise ValidationError(
                            f"Format non autorisé. Formats acceptés: {', '.join(allowed_formats).upper()}"
                        )
                except Exception as e:
                    if 'cannot identify image file' in str(e).lower():
                        raise ValidationError(
                            f"Format non autorisé. Formats acceptés: {', '.join(allowed_formats).upper()}"
                        )

    # ========================================
    # Méthodes computed
    # ========================================

    def _compute_module_info(self):
        """Compute module installation info - OPTIMISÉ avec cache."""
        # Recherche une seule fois pour tous les records (batch processing)
        module = self.env['ir.module.module'].search([
            ('name', '=', 'quelyos_branding')
        ], limit=1)

        version = module.installed_version or '19.0.1.0.0'
        active_since = module.write_date.date() if module.write_date else False

        # Assigner à tous les records en une seule fois
        for record in self:
            record.quelyos_branding_module_version = version
            record.quelyos_branding_active_since = active_since

    def _compute_custom_logos(self):
        """Count uploaded custom logos - OPTIMISÉ avec batch read."""
        params = self.env['ir.config_parameter'].sudo()

        # Récupérer tous les paramètres en une seule requête (batch)
        logo_params = [
            'quelyos.branding.logo_main_id',
            'quelyos.branding.logo_white_id',
            'quelyos.branding.logo_small_id',
            'quelyos.branding.logo_email_id',
            'quelyos.branding.favicon_id',
        ]

        # Compter une seule fois pour tous les records
        count = sum(1 for param in logo_params if params.get_param(param))

        # Assigner à tous les records
        for record in self:
            record.quelyos_branding_custom_logos = count

    # ========================================
    # Actions pour theme presets
    # ========================================

    def action_reset_to_defaults(self):
        """Reset all branding settings to default values."""
        params = self.env['ir.config_parameter'].sudo()

        default_values = {
            'quelyos.branding.company_name': 'Quelyos',
            'quelyos.branding.company_url': 'https://quelyos.com',
            'quelyos.branding.support_url': 'https://support.quelyos.com',
            'quelyos.branding.docs_url': 'https://docs.quelyos.com',
            'quelyos.branding.primary_color': '#1e40af',
            'quelyos.branding.secondary_color': '#10b981',
            'quelyos.branding.slogan': 'La plateforme SaaS omnicanal pour le retail',
            'quelyos.branding.contact_email': 'contact@quelyos.com',
            'quelyos.branding.show_logo_email': 'True',
            'quelyos.branding.email_footer_text': 'Envoyé par Quelyos - La plateforme retail omnicanal',
            'quelyos.branding.powered_by_text': 'Powered by Quelyos',
            'quelyos.branding.copyright_text': '© 2026 Quelyos - Tous droits réservés',
            'quelyos.branding.enable_full_debranding': 'True',
            'quelyos.branding.replace_odoo_text': 'True',
        }

        for key, value in default_values.items():
            params.set_param(key, value)

        return {
            'type': 'ir.actions.client',
            'tag': 'display_notification',
            'params': {
                'title': 'Réinitialisé',
                'message': 'Les paramètres ont été réinitialisés aux valeurs par défaut.',
                'type': 'success',
                'sticky': False,
            }
        }

    def action_set_blue_theme(self):
        """Set blue professional theme."""
        self.quelyos_branding_primary_color = '#1e40af'
        self.quelyos_branding_secondary_color = '#10b981'
        return self._show_theme_notification('Thème bleu professionnel appliqué')

    def action_set_green_theme(self):
        """Set green ecological theme."""
        self.quelyos_branding_primary_color = '#059669'
        self.quelyos_branding_secondary_color = '#34d399'
        return self._show_theme_notification('Thème vert écologique appliqué')

    def action_set_purple_theme(self):
        """Set purple creative theme."""
        self.quelyos_branding_primary_color = '#7c3aed'
        self.quelyos_branding_secondary_color = '#a78bfa'
        return self._show_theme_notification('Thème violet créatif appliqué')

    def action_set_red_theme(self):
        """Set red energetic theme."""
        self.quelyos_branding_primary_color = '#dc2626'
        self.quelyos_branding_secondary_color = '#f59e0b'
        return self._show_theme_notification('Thème rouge énergique appliqué')

    def _show_theme_notification(self, message):
        """Show theme change notification."""
        return {
            'type': 'ir.actions.client',
            'tag': 'display_notification',
            'params': {
                'title': 'Thème modifié',
                'message': message,
                'type': 'info',
                'sticky': False,
            }
        }

    @api.model
    def get_values(self):
        """Récupérer les valeurs des paramètres de configuration"""
        res = super(ResConfigSettings, self).get_values()
        params = self.env['ir.config_parameter'].sudo()

        res.update(
            quelyos_branding_company_name=params.get_param('quelyos.branding.company_name', 'Quelyos'),
            quelyos_branding_company_url=params.get_param('quelyos.branding.company_url', 'https://quelyos.com'),
            quelyos_branding_support_url=params.get_param('quelyos.branding.support_url', 'https://support.quelyos.com'),
            quelyos_branding_docs_url=params.get_param('quelyos.branding.docs_url', 'https://docs.quelyos.com'),
            quelyos_branding_primary_color=params.get_param('quelyos.branding.primary_color', '#1e40af'),
            quelyos_branding_secondary_color=params.get_param('quelyos.branding.secondary_color', '#10b981'),
            quelyos_branding_slogan=params.get_param('quelyos.branding.slogan', 'La plateforme SaaS omnicanal pour le retail'),
            quelyos_branding_contact_email=params.get_param('quelyos.branding.contact_email', 'contact@quelyos.com'),
            quelyos_branding_show_logo_email=params.get_param('quelyos.branding.show_logo_email', True),
            quelyos_branding_email_footer_text=params.get_param('quelyos.branding.email_footer_text', 'Envoyé par Quelyos'),
            quelyos_branding_powered_by_text=params.get_param('quelyos.branding.powered_by_text', 'Powered by Quelyos'),
            quelyos_branding_copyright_text=params.get_param('quelyos.branding.copyright_text', '© 2026 Quelyos'),
            quelyos_branding_enable_full_debranding=params.get_param('quelyos.branding.enable_full_debranding', True),
            quelyos_branding_replace_odoo_text=params.get_param('quelyos.branding.replace_odoo_text', True),
            quelyos_branding_favicon_path=params.get_param('quelyos.branding.favicon_path', '/quelyos_branding/static/src/img/favicon/favicon.ico'),
            quelyos_branding_logo_navbar_path=params.get_param('quelyos.branding.logo_navbar_path', '/quelyos_branding/static/src/img/logo/quelyos_logo_white.png'),
            quelyos_branding_logo_email_path=params.get_param('quelyos.branding.logo_email_path', '/quelyos_branding/static/src/img/logo/quelyos_logo.png'),
            quelyos_branding_logo_login_path=params.get_param('quelyos.branding.logo_login_path', '/quelyos_branding/static/src/img/logo/quelyos_logo_white.png'),
            quelyos_branding_login_bg_path=params.get_param('quelyos.branding.login_bg_path', '/quelyos_branding/static/src/img/backgrounds/login_bg.jpg'),
        )
        return res

    def set_values(self):
        """Sauvegarder les valeurs des paramètres de configuration - OPTIMISÉ"""
        super(ResConfigSettings, self).set_values()
        params = self.env['ir.config_parameter'].sudo()

        # Batch update des paramètres pour réduire les requêtes SQL
        params_to_set = {
            'quelyos.branding.company_name': self.quelyos_branding_company_name or 'Quelyos',
            'quelyos.branding.company_url': self.quelyos_branding_company_url or 'https://quelyos.com',
            'quelyos.branding.support_url': self.quelyos_branding_support_url or 'https://support.quelyos.com',
            'quelyos.branding.docs_url': self.quelyos_branding_docs_url or 'https://docs.quelyos.com',
            'quelyos.branding.primary_color': self.quelyos_branding_primary_color or '#1e40af',
            'quelyos.branding.secondary_color': self.quelyos_branding_secondary_color or '#10b981',
            'quelyos.branding.slogan': self.quelyos_branding_slogan or 'La plateforme SaaS omnicanal pour le retail',
            'quelyos.branding.contact_email': self.quelyos_branding_contact_email or 'contact@quelyos.com',
            'quelyos.branding.show_logo_email': str(self.quelyos_branding_show_logo_email),
            'quelyos.branding.email_footer_text': self.quelyos_branding_email_footer_text or 'Envoyé par Quelyos',
            'quelyos.branding.powered_by_text': self.quelyos_branding_powered_by_text or 'Powered by Quelyos',
            'quelyos.branding.copyright_text': self.quelyos_branding_copyright_text or '© 2026 Quelyos',
            'quelyos.branding.enable_full_debranding': str(self.quelyos_branding_enable_full_debranding),
            'quelyos.branding.replace_odoo_text': str(self.quelyos_branding_replace_odoo_text),
            'quelyos.branding.favicon_path': self.quelyos_branding_favicon_path or '/quelyos_branding/static/src/img/favicon/favicon.ico',
            'quelyos.branding.logo_navbar_path': self.quelyos_branding_logo_navbar_path or '/quelyos_branding/static/src/img/logo/quelyos_logo_white.png',
            'quelyos.branding.logo_email_path': self.quelyos_branding_logo_email_path or '/quelyos_branding/static/src/img/logo/quelyos_logo.png',
            'quelyos.branding.logo_login_path': self.quelyos_branding_logo_login_path or '/quelyos_branding/static/src/img/logo/quelyos_logo_white.png',
            'quelyos.branding.login_bg_path': self.quelyos_branding_login_bg_path or '/quelyos_branding/static/src/img/backgrounds/login_bg.jpg',
        }

        # Batch set params (réduit les requêtes SQL)
        for key, value in params_to_set.items():
            params.set_param(key, value)

        # Sauvegarder les logos uploadés comme attachments (OPTIMISÉ - évite les doublons)
        logos_updated = False
        if self.quelyos_branding_logo_main:
            self._save_logo_attachment('logo_main', self.quelyos_branding_logo_main, 'quelyos_logo_main.png', 'image/png')
            logos_updated = True
        if self.quelyos_branding_logo_white:
            self._save_logo_attachment('logo_white', self.quelyos_branding_logo_white, 'quelyos_logo_white.png', 'image/png')
            logos_updated = True
        if self.quelyos_branding_logo_small:
            self._save_logo_attachment('logo_small', self.quelyos_branding_logo_small, 'quelyos_logo_small.png', 'image/png')
            logos_updated = True
        if self.quelyos_branding_logo_email:
            self._save_logo_attachment('logo_email', self.quelyos_branding_logo_email, 'quelyos_logo_email.png', 'image/png')
            logos_updated = True
        if self.quelyos_branding_favicon:
            self._save_logo_attachment('favicon', self.quelyos_branding_favicon, 'quelyos_favicon.ico', 'image/x-icon')
            logos_updated = True

        # Invalider le cache du contrôleur de logos après mise à jour (OPTIMISATION)
        if logos_updated:
            from odoo.addons.quelyos_branding.controllers.logo_controller import QuelyosLogoController
            QuelyosLogoController.clear_logo_cache()

    def _save_logo_attachment(self, logo_type, logo_data, filename, mimetype):
        """
        Sauvegarde optimisée d'un logo en attachment.
        Supprime l'ancien attachment avant d'en créer un nouveau pour éviter les doublons.

        Args:
            logo_type: Type de logo (logo_main, logo_white, etc.)
            logo_data: Données binaires du logo
            filename: Nom du fichier
            mimetype: Type MIME (image/png, image/x-icon, etc.)
        """
        if not logo_data:
            return

        params = self.env['ir.config_parameter'].sudo()
        IrAttachment = self.env['ir.attachment'].sudo()
        param_key = f'quelyos.branding.{logo_type}_id'

        # Récupérer l'ancien attachment s'il existe
        old_attachment_id = params.get_param(param_key)

        # Supprimer l'ancien attachment pour éviter les doublons (OPTIMISATION)
        if old_attachment_id:
            old_attachment = IrAttachment.browse(int(old_attachment_id))
            if old_attachment.exists():
                old_attachment.unlink()

        # Créer le nouvel attachment
        attachment = IrAttachment.create({
            'name': filename,
            'type': 'binary',
            'datas': logo_data,
            'res_model': 'res.config.settings',
            'res_id': 0,
            'public': True,
            'mimetype': mimetype,
        })

        # Sauvegarder l'ID de l'attachment
        params.set_param(param_key, attachment.id)

# -*- coding: utf-8 -*-

"""
Logo Manager for Quelyos Branding
Handles saving, updating, and deleting logo attachments.
"""

from odoo import models, api
from odoo.exceptions import ValidationError


class LogoManager(models.AbstractModel):
    """
    Service for managing logo attachments.
    Handles create, update, delete operations with proper cleanup.
    """
    _name = 'quelyos.branding.logo.manager'
    _description = 'Logo Manager for Quelyos Branding'

    LOGO_TYPES = {
        'logo_main': {
            'filename': 'quelyos_logo_main.png',
            'mimetype': 'image/png',
            'param_key': 'quelyos.branding.logo_main_id',
        },
        'logo_white': {
            'filename': 'quelyos_logo_white.png',
            'mimetype': 'image/png',
            'param_key': 'quelyos.branding.logo_white_id',
        },
        'logo_small': {
            'filename': 'quelyos_logo_small.png',
            'mimetype': 'image/png',
            'param_key': 'quelyos.branding.logo_small_id',
        },
        'logo_email': {
            'filename': 'quelyos_logo_email.png',
            'mimetype': 'image/png',
            'param_key': 'quelyos.branding.logo_email_id',
        },
        'favicon': {
            'filename': 'quelyos_favicon.ico',
            'mimetype': 'image/x-icon',
            'param_key': 'quelyos.branding.favicon_id',
        },
    }

    @api.model
    def save_logo(self, logo_type, logo_data):
        """
        Sauvegarde un logo avec suppression de l'ancien.

        Process:
        1. Validate logo type
        2. Validate image data
        3. Delete old attachment (if exists)
        4. Create new attachment
        5. Update config parameter
        6. Clear logo cache

        Args:
            logo_type: Type of logo (logo_main, logo_white, etc.)
            logo_data: Binary image data (base64 encoded)

        Returns:
            int: ID of the new attachment

        Raises:
            ValidationError: If logo type is invalid or data is missing
        """
        if logo_type not in self.LOGO_TYPES:
            raise ValidationError(f"Type de logo invalide: {logo_type}")

        if not logo_data:
            raise ValidationError("Aucune donnée image fournie")

        # Validate image
        validator = self.env['quelyos.branding.image.validator']
        validator.validate_logo(logo_type, logo_data)

        # Get configuration
        config = self.LOGO_TYPES[logo_type]

        # Delete old attachment
        self._delete_old_logo(logo_type)

        # Create new attachment
        attachment = self._create_logo_attachment(
            logo_data,
            config['filename'],
            config['mimetype']
        )

        # Save attachment ID in config parameters
        self._save_logo_reference(logo_type, attachment.id)

        # Clear logo cache
        self._clear_logo_cache()

        return attachment.id

    def _delete_old_logo(self, logo_type):
        """
        Delete old logo attachment if it exists.

        Args:
            logo_type: Type of logo
        """
        config = self.LOGO_TYPES[logo_type]
        params = self.env['ir.config_parameter'].sudo()
        IrAttachment = self.env['ir.attachment'].sudo()

        # Get old attachment ID
        old_attachment_id = params.get_param(config['param_key'])

        if old_attachment_id:
            old_attachment = IrAttachment.browse(int(old_attachment_id))
            if old_attachment.exists():
                old_attachment.unlink()

    def _create_logo_attachment(self, logo_data, filename, mimetype):
        """
        Create a new logo attachment.

        Args:
            logo_data: Binary image data
            filename: Filename for attachment
            mimetype: MIME type (image/png, image/x-icon, etc.)

        Returns:
            ir.attachment: Created attachment record
        """
        IrAttachment = self.env['ir.attachment'].sudo()

        attachment = IrAttachment.create({
            'name': filename,
            'type': 'binary',
            'datas': logo_data,
            'res_model': 'res.config.settings',
            'res_id': 0,
            'public': True,
            'mimetype': mimetype,
        })

        return attachment

    def _save_logo_reference(self, logo_type, attachment_id):
        """
        Save attachment ID in config parameters.

        Args:
            logo_type: Type of logo
            attachment_id: ID of the attachment
        """
        config = self.LOGO_TYPES[logo_type]
        params = self.env['ir.config_parameter'].sudo()
        params.set_param(config['param_key'], attachment_id)

    def _clear_logo_cache(self):
        """
        Clear logo controller cache after update.
        """
        try:
            from odoo.addons.quelyos_branding.controllers.logo_controller import QuelyosLogoController
            QuelyosLogoController.clear_logo_cache()
        except ImportError:
            # Controller not available yet
            pass

    @api.model
    def get_logo(self, logo_type):
        """
        Get logo attachment for a given type.

        Args:
            logo_type: Type of logo

        Returns:
            ir.attachment: Logo attachment or False
        """
        if logo_type not in self.LOGO_TYPES:
            return False

        config = self.LOGO_TYPES[logo_type]
        params = self.env['ir.config_parameter'].sudo()
        IrAttachment = self.env['ir.attachment'].sudo()

        attachment_id = params.get_param(config['param_key'])

        if attachment_id:
            attachment = IrAttachment.browse(int(attachment_id))
            if attachment.exists():
                return attachment

        return False

    @api.model
    def delete_logo(self, logo_type):
        """
        Delete a logo and its reference.

        Args:
            logo_type: Type of logo

        Returns:
            bool: True if deleted successfully
        """
        if logo_type not in self.LOGO_TYPES:
            return False

        self._delete_old_logo(logo_type)

        # Clear parameter
        config = self.LOGO_TYPES[logo_type]
        params = self.env['ir.config_parameter'].sudo()
        params.set_param(config['param_key'], '')

        # Clear cache
        self._clear_logo_cache()

        return True

    @api.model
    def count_custom_logos(self):
        """
        Count number of uploaded custom logos.

        Returns:
            int: Number of custom logos
        """
        params = self.env['ir.config_parameter'].sudo()

        count = 0
        for logo_type, config in self.LOGO_TYPES.items():
            attachment_id = params.get_param(config['param_key'])
            if attachment_id:
                count += 1

        return count

    @api.model
    def get_all_logos(self):
        """
        Get all uploaded logos.

        Returns:
            dict: Dictionary mapping logo_type to attachment
        """
        logos = {}
        for logo_type in self.LOGO_TYPES.keys():
            attachment = self.get_logo(logo_type)
            if attachment:
                logos[logo_type] = attachment

        return logos

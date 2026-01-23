# -*- coding: utf-8 -*-

"""
Image Validator for Quelyos Branding
Handles validation of uploaded logos and images.
"""

from odoo import models, api
from odoo.exceptions import ValidationError
import base64
import io


class ImageValidator(models.AbstractModel):
    """
    Service for validating uploaded images.
    Supports PNG, JPEG, SVG, ICO formats with size and format checks.
    """
    _name = 'quelyos.branding.image.validator'
    _description = 'Image Validator for Quelyos Branding'

    # Configuration for different logo types
    LOGO_CONFIGS = {
        'logo_main': {
            'max_size_mb': 2,
            'allowed_formats': ['png', 'jpg', 'jpeg', 'svg'],
            'recommended_size': '1000x250px',
        },
        'logo_white': {
            'max_size_mb': 2,
            'allowed_formats': ['png', 'jpg', 'jpeg', 'svg'],
            'recommended_size': '1000x250px',
        },
        'logo_small': {
            'max_size_mb': 1,
            'allowed_formats': ['png', 'jpg', 'jpeg'],
            'recommended_size': '180x46px',
        },
        'logo_email': {
            'max_size_mb': 1,
            'allowed_formats': ['png', 'jpg', 'jpeg'],
            'recommended_size': '600x150px',
        },
        'favicon': {
            'max_size_mb': 0.5,
            'allowed_formats': ['ico', 'png'],
            'recommended_size': '32x32px',
        },
    }

    @api.model
    def validate_logo(self, logo_type, image_data):
        """
        Validate a logo based on its type.

        Args:
            logo_type: Type of logo (logo_main, logo_white, etc.)
            image_data: Binary image data (base64 encoded)

        Returns:
            bool: True if valid

        Raises:
            ValidationError: If validation fails
        """
        if logo_type not in self.LOGO_CONFIGS:
            raise ValidationError(f"Type de logo invalide: {logo_type}")

        config = self.LOGO_CONFIGS[logo_type]

        return self.validate_image(
            image_data,
            max_size_mb=config['max_size_mb'],
            allowed_formats=config['allowed_formats']
        )

    @api.model
    def validate_image(self, image_data, max_size_mb=2, allowed_formats=None):
        """
        Validate uploaded image - OPTIMISÉ pour performances.

        Utilise magic bytes pour détection rapide du format sans PIL.
        Fallback à PIL seulement si nécessaire.

        Args:
            image_data: Binary image data (base64 encoded)
            max_size_mb: Maximum file size in MB
            allowed_formats: List of allowed extensions (png, jpg, svg, ico)

        Returns:
            bool: True if valid

        Raises:
            ValidationError: If validation fails
        """
        if not image_data:
            return True

        # Decode base64 (fast)
        try:
            image_bytes = base64.b64decode(image_data)
        except Exception:
            raise ValidationError("Format d'image invalide (erreur de décodage base64)")

        # Check file size (fast - no I/O)
        size_mb = len(image_bytes) / (1024 * 1024)
        if size_mb > max_size_mb:
            raise ValidationError(
                f"L'image est trop volumineuse (max {max_size_mb}MB, taille: {size_mb:.2f}MB)"
            )

        # Check format - Validation rapide par signatures de fichiers (magic bytes)
        if allowed_formats:
            valid = self._validate_format_fast(image_bytes, allowed_formats)

            if not valid:
                # Fallback à PIL seulement si nécessaire (slower but more reliable)
                valid = self._validate_format_with_pil(image_bytes, allowed_formats)

            if not valid:
                raise ValidationError(
                    f"Format non autorisé. Formats acceptés: {', '.join(allowed_formats).upper()}"
                )

        return True

    def _validate_format_fast(self, image_bytes, allowed_formats):
        """
        Validate image format using magic bytes (fast).

        Args:
            image_bytes: Raw image bytes
            allowed_formats: List of allowed formats

        Returns:
            bool: True if valid, False if uncertain
        """
        # Lire seulement les premiers bytes pour détection rapide
        file_signature = image_bytes[:20]

        # SVG detection (fast)
        is_svg = (
            file_signature[:5] == b'<?xml' or
            file_signature[:4] == b'<svg' or
            b'<svg' in image_bytes[:100]
        )

        if 'svg' in allowed_formats and is_svg:
            return True

        # PNG detection (fast)
        # Magic bytes: 89 50 4E 47 0D 0A 1A 0A
        is_png = file_signature[:8] == b'\x89PNG\r\n\x1a\n'

        if 'png' in allowed_formats and is_png:
            return True

        # JPEG detection (fast)
        # Magic bytes: FF D8 FF
        is_jpeg = file_signature[:3] == b'\xff\xd8\xff'

        if ('jpg' in allowed_formats or 'jpeg' in allowed_formats) and is_jpeg:
            return True

        # ICO detection (fast)
        # Magic bytes: 00 00 01 00
        is_ico = file_signature[:4] == b'\x00\x00\x01\x00'

        if 'ico' in allowed_formats and is_ico:
            return True

        # Uncertain - return False to trigger PIL fallback
        return False

    def _validate_format_with_pil(self, image_bytes, allowed_formats):
        """
        Validate image format using PIL (slower but reliable).

        Args:
            image_bytes: Raw image bytes
            allowed_formats: List of allowed formats

        Returns:
            bool: True if valid, False otherwise
        """
        try:
            from PIL import Image
            img = Image.open(io.BytesIO(image_bytes))
            format_lower = img.format.lower() if img.format else ''

            # Normalize format names
            if format_lower == 'jpeg':
                format_lower = 'jpg'

            return format_lower in allowed_formats

        except ImportError:
            # PIL not available - trust magic bytes validation
            return False

        except Exception as e:
            # Cannot identify image file
            if 'cannot identify image file' in str(e).lower():
                return False
            # Re-raise other exceptions
            raise

    @api.model
    def get_logo_config(self, logo_type):
        """
        Get configuration for a specific logo type.

        Args:
            logo_type: Type of logo

        Returns:
            dict: Configuration dictionary
        """
        return self.LOGO_CONFIGS.get(logo_type, {})

    @api.model
    def get_recommended_size(self, logo_type):
        """
        Get recommended size for a logo type.

        Args:
            logo_type: Type of logo

        Returns:
            str: Recommended size (e.g., '1000x250px')
        """
        config = self.LOGO_CONFIGS.get(logo_type, {})
        return config.get('recommended_size', 'N/A')

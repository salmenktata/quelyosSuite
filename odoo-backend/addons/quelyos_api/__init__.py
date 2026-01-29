# -*- coding: utf-8 -*-
import logging
import odoo
from odoo.exceptions import UserError

_logger = logging.getLogger(__name__)


def pre_init_hook(cr):
    """
    Bloquer installation si Odoo != 19.
    Garantit l'isolation et la compatibilité stricte avec Odoo 19.
    """
    odoo_version = odoo.release.version_info[0]
    if odoo_version != 19:
        error_msg = (
            f"Quelyos API requiert Odoo 19.0.x exactement.\n"
            f"Version détectée : {odoo.release.version}\n"
            f"Veuillez installer Odoo 19 avant d'installer Quelyos Suite."
        )
        _logger.error(error_msg)
        raise UserError(error_msg)

    _logger.info(f"✓ Version Odoo validée : {odoo.release.version}")


from . import controllers
from . import models

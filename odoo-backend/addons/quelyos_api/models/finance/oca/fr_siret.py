# -*- coding: utf-8 -*-
"""
Validation SIREN/SIRET - Quelyos Native
Adapted from OCA l10n-france/l10n_fr_siret
License: AGPL-3.0
"""

import logging
from odoo import models, fields, api, _
from odoo.exceptions import ValidationError

_logger = logging.getLogger(__name__)


class QuelyosSIRETValidator(models.AbstractModel):
    """Validateur SIREN/SIRET avec clé Luhn"""
    
    _name = 'quelyos.finance.siret_validator'
    _description = 'Validateur SIREN/SIRET'
    
    @api.model
    def _luhn_check(self, number_str):
        """
        Algorithme de Luhn pour validation SIREN/SIRET
        Returns: True si valide
        """
        if not number_str or not number_str.isdigit():
            return False
        
        digits = [int(d) for d in number_str]
        checksum = 0
        
        for i, digit in enumerate(reversed(digits)):
            if i % 2 == 1:  # Positions paires (en partant de la fin)
                digit *= 2
                if digit > 9:
                    digit -= 9
            checksum += digit
        
        return checksum % 10 == 0
    
    @api.model
    def validate_siren(self, siren):
        """
        Valide un SIREN (9 chiffres)
        Returns: (valid, error_message)
        """
        if not siren:
            return (False, "SIREN vide")
        
        # Nettoyer espaces
        siren = siren.replace(' ', '').replace('.', '')
        
        if len(siren) != 9:
            return (False, f"SIREN doit faire 9 chiffres (actuel: {len(siren)})")
        
        if not siren.isdigit():
            return (False, "SIREN doit contenir uniquement des chiffres")
        
        if not self._luhn_check(siren):
            return (False, "SIREN invalide (échec clé Luhn)")
        
        return (True, None)
    
    @api.model
    def validate_siret(self, siret):
        """
        Valide un SIRET (14 chiffres = SIREN + NIC)
        Returns: (valid, error_message)
        """
        if not siret:
            return (False, "SIRET vide")
        
        # Nettoyer espaces
        siret = siret.replace(' ', '').replace('.', '')
        
        if len(siret) != 14:
            return (False, f"SIRET doit faire 14 chiffres (actuel: {len(siret)})")
        
        if not siret.isdigit():
            return (False, "SIRET doit contenir uniquement des chiffres")
        
        if not self._luhn_check(siret):
            return (False, "SIRET invalide (échec clé Luhn)")
        
        # Valider aussi le SIREN (9 premiers chiffres)
        siren = siret[:9]
        siren_valid, siren_error = self.validate_siren(siren)
        if not siren_valid:
            return (False, f"SIREN invalide dans SIRET: {siren_error}")
        
        return (True, None)
    
    @api.model
    def format_siren(self, siren):
        """Formate un SIREN : XXX XXX XXX"""
        if not siren:
            return ""
        siren = siren.replace(' ', '').replace('.', '')
        if len(siren) == 9:
            return f"{siren[0:3]} {siren[3:6]} {siren[6:9]}"
        return siren
    
    @api.model
    def format_siret(self, siret):
        """Formate un SIRET : XXX XXX XXX XXXXX"""
        if not siret:
            return ""
        siret = siret.replace(' ', '').replace('.', '')
        if len(siret) == 14:
            return f"{siret[0:3]} {siret[3:6]} {siret[6:9]} {siret[9:14]}"
        return siret


# Extension res.partner pour validation automatique
class ResPartner(models.Model):
    _inherit = 'res.partner'
    
    @api.constrains('company_registry')
    def _check_siren_siret(self):
        """Valide automatiquement SIREN/SIRET"""
        validator = self.env['quelyos.finance.siret_validator']
        
        for partner in self:
            if partner.company_registry and partner.country_id.code == 'FR':
                registry = partner.company_registry.replace(' ', '').replace('.', '')
                
                # Détecter SIREN ou SIRET
                if len(registry) == 9:
                    valid, error = validator.validate_siren(registry)
                    if not valid:
                        raise ValidationError(f"SIREN invalide pour {partner.name}: {error}")
                elif len(registry) == 14:
                    valid, error = validator.validate_siret(registry)
                    if not valid:
                        raise ValidationError(f"SIRET invalide pour {partner.name}: {error}")

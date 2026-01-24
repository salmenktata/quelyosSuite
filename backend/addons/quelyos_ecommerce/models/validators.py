# -*- coding: utf-8 -*-
"""
Validateurs communs pour le module e-commerce.
"""

import re
from odoo.exceptions import ValidationError


def validate_email(email):
    """Valide une adresse email."""
    if not email:
        return True
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email):
        raise ValidationError(f"L'adresse email '{email}' n'est pas valide.")
    return True


def validate_phone(phone):
    """Valide un numéro de téléphone."""
    if not phone:
        return True
    # Supprimer les espaces et caractères de formatage
    cleaned = re.sub(r'[\s\-\.\(\)]', '', phone)
    # Vérifier que ça ressemble à un numéro
    if not re.match(r'^\+?[0-9]{8,15}$', cleaned):
        raise ValidationError(f"Le numéro de téléphone '{phone}' n'est pas valide.")
    return True


def validate_slug(slug):
    """Valide un slug URL."""
    if not slug:
        return True
    pattern = r'^[a-z0-9]+(?:-[a-z0-9]+)*$'
    if not re.match(pattern, slug):
        raise ValidationError(
            f"Le slug '{slug}' n'est pas valide. "
            "Utilisez uniquement des lettres minuscules, chiffres et tirets."
        )
    return True


def validate_positive_number(value, field_name="Valeur"):
    """Valide qu'un nombre est positif."""
    if value is not None and value < 0:
        raise ValidationError(f"{field_name} doit être un nombre positif.")
    return True


def validate_percentage(value, field_name="Pourcentage"):
    """Valide qu'une valeur est un pourcentage valide (0-100)."""
    if value is not None and (value < 0 or value > 100):
        raise ValidationError(f"{field_name} doit être compris entre 0 et 100.")
    return True

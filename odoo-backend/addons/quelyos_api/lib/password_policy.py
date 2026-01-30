# -*- coding: utf-8 -*-
"""
Password Policy pour Quelyos API

Politique de sécurité des mots de passe:
- Complexité minimum (longueur, caractères)
- Blocage après échecs répétés
- Historique des mots de passe (anti-réutilisation)
- Expiration optionnelle
"""

import re
import logging
from typing import Tuple, List, Optional
from datetime import datetime, timedelta

_logger = logging.getLogger(__name__)


# =============================================================================
# CONFIGURATION
# =============================================================================

class PasswordPolicyConfig:
    """Configuration de la politique de mot de passe"""

    # Longueur
    MIN_LENGTH = 8
    MAX_LENGTH = 128

    # Complexité requise
    REQUIRE_UPPERCASE = True      # Au moins une majuscule
    REQUIRE_LOWERCASE = True      # Au moins une minuscule
    REQUIRE_DIGIT = True          # Au moins un chiffre
    REQUIRE_SPECIAL = True        # Au moins un caractère spécial

    # Caractères spéciaux autorisés
    SPECIAL_CHARS = r'!@#$%^&*()_+-=[]{}|;:,.<>?'

    # Blocage après échecs
    MAX_FAILED_ATTEMPTS = 5       # Nombre d'échecs avant blocage
    LOCKOUT_DURATION_MINUTES = 15  # Durée du blocage

    # Historique
    PASSWORD_HISTORY_COUNT = 5    # Nombre de mots de passe à retenir

    # Expiration (0 = pas d'expiration)
    PASSWORD_EXPIRY_DAYS = 0      # Jours avant expiration

    # Mots de passe interdits (communs)
    FORBIDDEN_PASSWORDS = [
        'password', 'password1', 'password123',
        '12345678', '123456789', '1234567890',
        'qwerty', 'qwertyuiop', 'azerty',
        'admin', 'admin123', 'administrator',
        'letmein', 'welcome', 'monkey',
        'dragon', 'master', 'login',
    ]


# =============================================================================
# VALIDATION
# =============================================================================

def validate_password_strength(password: str) -> Tuple[bool, List[str]]:
    """
    Valide la force d'un mot de passe selon la politique.

    Args:
        password: Mot de passe à valider

    Returns:
        Tuple (is_valid, list_of_errors)
    """
    errors = []
    config = PasswordPolicyConfig

    if not password:
        return False, ["Le mot de passe est requis"]

    # Longueur minimum
    if len(password) < config.MIN_LENGTH:
        errors.append(f"Minimum {config.MIN_LENGTH} caractères requis")

    # Longueur maximum
    if len(password) > config.MAX_LENGTH:
        errors.append(f"Maximum {config.MAX_LENGTH} caractères autorisés")

    # Majuscule
    if config.REQUIRE_UPPERCASE and not re.search(r'[A-Z]', password):
        errors.append("Au moins une lettre majuscule requise")

    # Minuscule
    if config.REQUIRE_LOWERCASE and not re.search(r'[a-z]', password):
        errors.append("Au moins une lettre minuscule requise")

    # Chiffre
    if config.REQUIRE_DIGIT and not re.search(r'\d', password):
        errors.append("Au moins un chiffre requis")

    # Caractère spécial
    if config.REQUIRE_SPECIAL:
        special_pattern = f'[{re.escape(config.SPECIAL_CHARS)}]'
        if not re.search(special_pattern, password):
            errors.append("Au moins un caractère spécial requis (!@#$%^&*...)")

    # Mots de passe interdits
    if password.lower() in config.FORBIDDEN_PASSWORDS:
        errors.append("Ce mot de passe est trop commun")

    # Séquences répétitives
    if re.search(r'(.)\1{2,}', password):
        errors.append("Évitez les caractères répétés (aaa, 111...)")

    # Séquences consécutives
    if _has_sequential_chars(password):
        errors.append("Évitez les séquences (abc, 123...)")

    return len(errors) == 0, errors


def _has_sequential_chars(password: str, min_seq: int = 3) -> bool:
    """Détecte les séquences de caractères consécutifs"""
    password_lower = password.lower()

    for i in range(len(password_lower) - min_seq + 1):
        # Séquence croissante
        is_ascending = all(
            ord(password_lower[i + j + 1]) == ord(password_lower[i + j]) + 1
            for j in range(min_seq - 1)
        )
        # Séquence décroissante
        is_descending = all(
            ord(password_lower[i + j + 1]) == ord(password_lower[i + j]) - 1
            for j in range(min_seq - 1)
        )

        if is_ascending or is_descending:
            return True

    return False


def get_password_strength_score(password: str) -> int:
    """
    Calcule un score de force du mot de passe (0-100).

    Args:
        password: Mot de passe à évaluer

    Returns:
        Score de 0 à 100
    """
    if not password:
        return 0

    score = 0

    # Longueur (jusqu'à 25 points)
    score += min(len(password) * 2, 25)

    # Majuscules (10 points)
    if re.search(r'[A-Z]', password):
        score += 10

    # Minuscules (10 points)
    if re.search(r'[a-z]', password):
        score += 10

    # Chiffres (15 points)
    if re.search(r'\d', password):
        score += 15

    # Caractères spéciaux (20 points)
    if re.search(r'[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]', password):
        score += 20

    # Mélange de types (10 points)
    types_count = sum([
        bool(re.search(r'[A-Z]', password)),
        bool(re.search(r'[a-z]', password)),
        bool(re.search(r'\d', password)),
        bool(re.search(r'[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]', password)),
    ])
    if types_count >= 3:
        score += 10

    # Pénalités
    if password.lower() in PasswordPolicyConfig.FORBIDDEN_PASSWORDS:
        score = max(0, score - 50)

    if re.search(r'(.)\1{2,}', password):
        score = max(0, score - 10)

    return min(score, 100)


def get_strength_label(score: int) -> str:
    """Retourne un label pour le score de force"""
    if score < 30:
        return 'weak'
    elif score < 50:
        return 'fair'
    elif score < 70:
        return 'good'
    elif score < 90:
        return 'strong'
    else:
        return 'excellent'


# =============================================================================
# ACCOUNT LOCKOUT
# =============================================================================

# Cache en mémoire pour les tentatives échouées
# En production, utiliser Redis via rate_limiter
_failed_attempts = {}


def record_failed_login(identifier: str) -> Tuple[int, bool]:
    """
    Enregistre une tentative de connexion échouée.

    Args:
        identifier: Email ou IP de l'utilisateur

    Returns:
        Tuple (attempts_count, is_locked)
    """
    config = PasswordPolicyConfig
    now = datetime.now()

    if identifier not in _failed_attempts:
        _failed_attempts[identifier] = {
            'count': 0,
            'first_attempt': now,
            'locked_until': None,
        }

    record = _failed_attempts[identifier]

    # Vérifier si le blocage est expiré
    if record['locked_until'] and now > record['locked_until']:
        record['count'] = 0
        record['locked_until'] = None

    # Incrémenter le compteur
    record['count'] += 1

    # Vérifier si on doit bloquer
    if record['count'] >= config.MAX_FAILED_ATTEMPTS:
        record['locked_until'] = now + timedelta(minutes=config.LOCKOUT_DURATION_MINUTES)
        _logger.warning(f"Account locked for {identifier} after {record['count']} failed attempts")
        return record['count'], True

    return record['count'], False


def is_account_locked(identifier: str) -> Tuple[bool, Optional[int]]:
    """
    Vérifie si un compte est bloqué.

    Args:
        identifier: Email ou IP de l'utilisateur

    Returns:
        Tuple (is_locked, seconds_remaining)
    """
    if identifier not in _failed_attempts:
        return False, None

    record = _failed_attempts[identifier]
    now = datetime.now()

    if record['locked_until'] and now < record['locked_until']:
        remaining = int((record['locked_until'] - now).total_seconds())
        return True, remaining

    return False, None


def reset_failed_attempts(identifier: str):
    """Réinitialise le compteur d'échecs après une connexion réussie"""
    if identifier in _failed_attempts:
        del _failed_attempts[identifier]


# =============================================================================
# PASSWORD HISTORY (requires Odoo model)
# =============================================================================

def check_password_history(env, user_id: int, new_password_hash: str) -> bool:
    """
    Vérifie si le mot de passe n'a pas été utilisé récemment.

    Args:
        env: Environnement Odoo
        user_id: ID de l'utilisateur
        new_password_hash: Hash du nouveau mot de passe

    Returns:
        True si le mot de passe peut être utilisé, False sinon
    """
    try:
        PasswordHistory = env['quelyos.password.history']
        config = PasswordPolicyConfig

        # Récupérer les derniers mots de passe
        history = PasswordHistory.sudo().search([
            ('user_id', '=', user_id)
        ], order='create_date desc', limit=config.PASSWORD_HISTORY_COUNT)

        # Vérifier si le hash existe dans l'historique
        for record in history:
            if record.password_hash == new_password_hash:
                return False

        return True

    except Exception as e:
        _logger.debug(f"Password history check skipped: {e}")
        return True


def add_to_password_history(env, user_id: int, password_hash: str):
    """Ajoute un mot de passe à l'historique"""
    try:
        PasswordHistory = env['quelyos.password.history']
        config = PasswordPolicyConfig

        # Ajouter le nouveau
        PasswordHistory.sudo().create({
            'user_id': user_id,
            'password_hash': password_hash,
        })

        # Supprimer les anciens au-delà de la limite
        old_records = PasswordHistory.sudo().search([
            ('user_id', '=', user_id)
        ], order='create_date desc', offset=config.PASSWORD_HISTORY_COUNT)
        old_records.unlink()

    except Exception as e:
        _logger.debug(f"Password history update skipped: {e}")


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def validate_password_change(
    password: str,
    confirm_password: str = None,
    current_password: str = None,
    user_email: str = None
) -> Tuple[bool, List[str]]:
    """
    Valide un changement de mot de passe complet.

    Args:
        password: Nouveau mot de passe
        confirm_password: Confirmation du mot de passe
        current_password: Mot de passe actuel (pour changement)
        user_email: Email de l'utilisateur (pour vérifier qu'il n'est pas dans le mdp)

    Returns:
        Tuple (is_valid, errors)
    """
    errors = []

    # Validation de la force
    is_strong, strength_errors = validate_password_strength(password)
    errors.extend(strength_errors)

    # Confirmation
    if confirm_password is not None and password != confirm_password:
        errors.append("Les mots de passe ne correspondent pas")

    # Vérifier que le mot de passe ne contient pas l'email
    if user_email:
        email_local = user_email.split('@')[0].lower()
        if len(email_local) > 3 and email_local in password.lower():
            errors.append("Le mot de passe ne doit pas contenir votre email")

    return len(errors) == 0, errors

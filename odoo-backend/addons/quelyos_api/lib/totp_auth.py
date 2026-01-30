# -*- coding: utf-8 -*-
"""
TOTP Authentication Library pour 2FA/MFA.

Implémente Time-based One-Time Password (RFC 6238)
compatible avec Google Authenticator, Authy, etc.
"""

import base64
import hashlib
import hmac
import struct
import time
import secrets
import logging
from typing import Tuple, Optional
from urllib.parse import quote

_logger = logging.getLogger(__name__)


# =============================================================================
# CONFIGURATION
# =============================================================================

class TOTPConfig:
    """Configuration TOTP"""

    # Intervalle de temps (secondes) - Standard: 30s
    TIME_STEP = 30

    # Nombre de digits du code - Standard: 6
    CODE_DIGITS = 6

    # Algorithme de hachage
    HASH_ALGORITHM = 'sha1'  # Compatibilité Google Authenticator

    # Tolérance de fenêtre (nombre de périodes avant/après)
    # 1 = accepte code précédent et suivant (90s de marge totale)
    WINDOW_TOLERANCE = 1

    # Longueur du secret (bytes) - 20 bytes = 160 bits (recommandé)
    SECRET_LENGTH = 20

    # Nom de l'application pour le QR code
    ISSUER = 'Quelyos Suite'

    # Codes de backup (combien générer)
    BACKUP_CODES_COUNT = 10
    BACKUP_CODE_LENGTH = 8


# =============================================================================
# CORE TOTP FUNCTIONS
# =============================================================================

def generate_secret() -> str:
    """
    Génère un secret TOTP aléatoire encodé en base32.

    Returns:
        str: Secret en base32 (32 caractères)
    """
    # Générer bytes aléatoires
    secret_bytes = secrets.token_bytes(TOTPConfig.SECRET_LENGTH)

    # Encoder en base32 (format standard pour les apps authenticator)
    secret_b32 = base64.b32encode(secret_bytes).decode('utf-8')

    return secret_b32


def generate_totp_code(secret: str, timestamp: Optional[int] = None) -> str:
    """
    Génère un code TOTP à partir du secret.

    Args:
        secret: Secret en base32
        timestamp: Timestamp Unix (défaut: maintenant)

    Returns:
        str: Code TOTP à 6 digits
    """
    if timestamp is None:
        timestamp = int(time.time())

    # Calculer le compteur de périodes
    counter = timestamp // TOTPConfig.TIME_STEP

    # Décoder le secret
    try:
        key = base64.b32decode(secret.upper().replace(' ', ''))
    except Exception as e:
        _logger.error(f"Invalid TOTP secret: {e}")
        raise ValueError("Secret TOTP invalide")

    # Encoder le compteur en big-endian 8 bytes
    counter_bytes = struct.pack('>Q', counter)

    # HMAC-SHA1
    hmac_hash = hmac.new(key, counter_bytes, hashlib.sha1).digest()

    # Dynamic truncation (RFC 4226)
    offset = hmac_hash[-1] & 0x0F
    truncated = struct.unpack('>I', hmac_hash[offset:offset + 4])[0]
    truncated &= 0x7FFFFFFF  # Clear MSB

    # Générer le code
    code = truncated % (10 ** TOTPConfig.CODE_DIGITS)

    return str(code).zfill(TOTPConfig.CODE_DIGITS)


def verify_totp_code(secret: str, code: str, timestamp: Optional[int] = None) -> bool:
    """
    Vérifie un code TOTP avec tolérance de fenêtre.

    Args:
        secret: Secret en base32
        code: Code fourni par l'utilisateur
        timestamp: Timestamp Unix (défaut: maintenant)

    Returns:
        bool: True si le code est valide
    """
    if not code or not secret:
        return False

    # Nettoyer le code (espaces, tirets)
    code = code.replace(' ', '').replace('-', '')

    if len(code) != TOTPConfig.CODE_DIGITS:
        return False

    if timestamp is None:
        timestamp = int(time.time())

    # Vérifier avec tolérance de fenêtre
    for offset in range(-TOTPConfig.WINDOW_TOLERANCE, TOTPConfig.WINDOW_TOLERANCE + 1):
        check_timestamp = timestamp + (offset * TOTPConfig.TIME_STEP)
        expected_code = generate_totp_code(secret, check_timestamp)

        # Comparaison constante pour éviter timing attacks
        if hmac.compare_digest(code, expected_code):
            return True

    return False


# =============================================================================
# PROVISIONING URI & QR CODE
# =============================================================================

def get_provisioning_uri(secret: str, email: str, issuer: Optional[str] = None) -> str:
    """
    Génère l'URI de provisioning pour les apps authenticator.
    Format: otpauth://totp/ISSUER:EMAIL?secret=SECRET&issuer=ISSUER&algorithm=SHA1&digits=6&period=30

    Args:
        secret: Secret en base32
        email: Email/identifiant de l'utilisateur
        issuer: Nom de l'application (défaut: Quelyos Suite)

    Returns:
        str: URI otpauth://
    """
    if issuer is None:
        issuer = TOTPConfig.ISSUER

    # Nettoyer le secret (enlever espaces)
    secret_clean = secret.replace(' ', '').upper()

    # Encoder les paramètres
    label = f"{quote(issuer)}:{quote(email)}"

    params = [
        f"secret={secret_clean}",
        f"issuer={quote(issuer)}",
        f"algorithm={TOTPConfig.HASH_ALGORITHM.upper()}",
        f"digits={TOTPConfig.CODE_DIGITS}",
        f"period={TOTPConfig.TIME_STEP}",
    ]

    uri = f"otpauth://totp/{label}?{'&'.join(params)}"

    return uri


def get_qr_code_data_uri(secret: str, email: str, issuer: Optional[str] = None) -> str:
    """
    Génère un QR code en data URI (base64 PNG).
    Utilise la lib qrcode si disponible, sinon retourne l'URI texte.

    Args:
        secret: Secret en base32
        email: Email de l'utilisateur
        issuer: Nom de l'application

    Returns:
        str: Data URI du QR code ou URI otpauth si qrcode non disponible
    """
    uri = get_provisioning_uri(secret, email, issuer)

    try:
        import qrcode
        import io

        # Créer le QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(uri)
        qr.make(fit=True)

        # Générer l'image PNG
        img = qr.make_image(fill_color="black", back_color="white")

        # Convertir en base64
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')

        return f"data:image/png;base64,{img_base64}"

    except ImportError:
        _logger.warning("qrcode library not installed, returning text URI")
        return uri


# =============================================================================
# BACKUP CODES
# =============================================================================

def generate_backup_codes() -> list:
    """
    Génère des codes de secours pour récupération sans authenticator.

    Returns:
        list: Liste de codes de backup en clair
    """
    codes = []
    for _ in range(TOTPConfig.BACKUP_CODES_COUNT):
        # Générer un code alphanumérique
        code = secrets.token_hex(TOTPConfig.BACKUP_CODE_LENGTH // 2).upper()
        # Formater avec tiret pour lisibilité (XXXX-XXXX)
        formatted = f"{code[:4]}-{code[4:]}"
        codes.append(formatted)

    return codes


def hash_backup_code(code: str) -> str:
    """
    Hash un code de backup pour stockage sécurisé.

    Args:
        code: Code en clair

    Returns:
        str: Hash du code
    """
    # Nettoyer le code
    code_clean = code.replace('-', '').replace(' ', '').upper()

    # SHA256 du code
    return hashlib.sha256(code_clean.encode()).hexdigest()


def verify_backup_code(code: str, hashed_codes: list) -> Tuple[bool, Optional[str]]:
    """
    Vérifie un code de backup contre une liste de hashes.

    Args:
        code: Code fourni par l'utilisateur
        hashed_codes: Liste des hashes de codes valides

    Returns:
        Tuple (is_valid, matched_hash) - Le hash utilisé pour pouvoir le supprimer
    """
    code_hash = hash_backup_code(code)

    for stored_hash in hashed_codes:
        if hmac.compare_digest(code_hash, stored_hash):
            return True, stored_hash

    return False, None


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def format_secret_for_display(secret: str) -> str:
    """
    Formate le secret pour affichage (groupes de 4 caractères).

    Args:
        secret: Secret en base32

    Returns:
        str: Secret formaté (XXXX XXXX XXXX ...)
    """
    secret_clean = secret.replace(' ', '').upper()
    return ' '.join([secret_clean[i:i+4] for i in range(0, len(secret_clean), 4)])


def get_remaining_seconds() -> int:
    """
    Retourne le nombre de secondes avant expiration du code actuel.

    Returns:
        int: Secondes restantes (0-29)
    """
    return TOTPConfig.TIME_STEP - (int(time.time()) % TOTPConfig.TIME_STEP)

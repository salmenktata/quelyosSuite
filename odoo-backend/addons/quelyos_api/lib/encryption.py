# -*- coding: utf-8 -*-
"""
Data Encryption at Rest pour Quelyos ERP

Chiffrement des données sensibles en base:
- Chiffrement AES-256-GCM
- Rotation des clés
- Champs encryptés transparents
- Recherche sur données chiffrées (via hash)

IMPORTANT: Ne jamais stocker les clés en clair dans le code!
"""

import os
import base64
import hashlib
import logging
from typing import Optional, Any
from functools import lru_cache

_logger = logging.getLogger(__name__)

# Configuration
ENCRYPTION_KEY = os.environ.get('QUELYOS_ENCRYPTION_KEY')
ENCRYPTION_KEY_ID = os.environ.get('QUELYOS_ENCRYPTION_KEY_ID', 'v1')
HASH_SALT = os.environ.get('QUELYOS_HASH_SALT', 'quelyos-2024')

# Vérifier si cryptography est disponible
try:
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
    from cryptography.hazmat.backends import default_backend
    CRYPTO_AVAILABLE = True
except ImportError:
    CRYPTO_AVAILABLE = False
    _logger.warning("cryptography not installed. Encryption disabled.")


# =============================================================================
# KEY DERIVATION
# =============================================================================

@lru_cache(maxsize=4)
def derive_key(master_key: str, key_id: str = 'v1') -> bytes:
    """
    Dérive une clé de chiffrement à partir de la clé maître.

    Args:
        master_key: Clé maître (mot de passe)
        key_id: Identifiant de version de la clé

    Returns:
        Clé dérivée de 256 bits
    """
    if not CRYPTO_AVAILABLE:
        return master_key.encode()[:32].ljust(32, b'\0')

    salt = f"{HASH_SALT}:{key_id}".encode()

    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
        backend=default_backend()
    )

    return kdf.derive(master_key.encode())


def get_current_key() -> Optional[bytes]:
    """Retourne la clé de chiffrement actuelle"""
    if not ENCRYPTION_KEY:
        return None
    return derive_key(ENCRYPTION_KEY, ENCRYPTION_KEY_ID)


# =============================================================================
# ENCRYPTION / DECRYPTION
# =============================================================================

def encrypt(plaintext: str, key: bytes = None) -> str:
    """
    Chiffre une chaîne avec AES-256-GCM.

    Args:
        plaintext: Texte en clair
        key: Clé de chiffrement (utilise la clé par défaut si None)

    Returns:
        Texte chiffré encodé en base64 avec le format:
        {key_id}:{nonce}:{ciphertext}
    """
    if not plaintext:
        return ''

    key = key or get_current_key()
    if not key or not CRYPTO_AVAILABLE:
        # Fallback: base64 simple (pas sécurisé mais évite le clair)
        return f"b64:{base64.b64encode(plaintext.encode()).decode()}"

    # Générer un nonce aléatoire (12 bytes pour GCM)
    nonce = os.urandom(12)

    # Chiffrer
    aesgcm = AESGCM(key)
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode(), None)

    # Encoder
    nonce_b64 = base64.b64encode(nonce).decode()
    ciphertext_b64 = base64.b64encode(ciphertext).decode()

    return f"{ENCRYPTION_KEY_ID}:{nonce_b64}:{ciphertext_b64}"


def decrypt(encrypted: str, key: bytes = None) -> str:
    """
    Déchiffre une chaîne chiffrée avec AES-256-GCM.

    Args:
        encrypted: Texte chiffré
        key: Clé de chiffrement

    Returns:
        Texte en clair
    """
    if not encrypted:
        return ''

    # Fallback base64
    if encrypted.startswith('b64:'):
        return base64.b64decode(encrypted[4:]).decode()

    parts = encrypted.split(':')
    if len(parts) != 3:
        raise ValueError("Invalid encrypted format")

    key_id, nonce_b64, ciphertext_b64 = parts

    # Obtenir la clé pour cette version
    master_key = ENCRYPTION_KEY
    if not master_key:
        raise ValueError("Encryption key not configured")

    key = key or derive_key(master_key, key_id)

    if not CRYPTO_AVAILABLE:
        raise ValueError("Cryptography library not available")

    # Décoder
    nonce = base64.b64decode(nonce_b64)
    ciphertext = base64.b64decode(ciphertext_b64)

    # Déchiffrer
    aesgcm = AESGCM(key)
    plaintext = aesgcm.decrypt(nonce, ciphertext, None)

    return plaintext.decode()


# =============================================================================
# SEARCHABLE ENCRYPTION
# =============================================================================

def hash_for_search(value: str) -> str:
    """
    Génère un hash pour recherche sur données chiffrées.

    Le hash est déterministe, permettant la recherche d'égalité
    sur des données chiffrées sans exposer le contenu.

    Args:
        value: Valeur à hasher

    Returns:
        Hash en hexadécimal
    """
    if not value:
        return ''

    # Normaliser la valeur (lowercase, strip)
    normalized = value.lower().strip()

    # HMAC avec le salt
    key = HASH_SALT.encode()
    h = hashlib.pbkdf2_hmac('sha256', normalized.encode(), key, 10000)

    return h.hex()


def blind_index(value: str, field_name: str = '') -> str:
    """
    Génère un blind index pour recherche.

    Différent de hash_for_search car inclut le nom du champ,
    évitant les attaques par corrélation entre champs.

    Args:
        value: Valeur à indexer
        field_name: Nom du champ

    Returns:
        Index aveugle
    """
    if not value:
        return ''

    combined = f"{field_name}:{value.lower().strip()}"
    key = HASH_SALT.encode()
    h = hashlib.pbkdf2_hmac('sha256', combined.encode(), key, 10000)

    return h.hex()[:32]  # Tronqué pour économiser l'espace


# =============================================================================
# FIELD ENCRYPTION (pour Odoo)
# =============================================================================

class EncryptedField:
    """
    Wrapper pour champs Odoo chiffrés.

    Usage dans un modèle Odoo:
        class Partner(models.Model):
            _inherit = 'res.partner'

            ssn = fields.Char(string="SSN")
            ssn_encrypted = fields.Char(compute='_compute_ssn_encrypted', store=True)
            ssn_search = fields.Char(compute='_compute_ssn_search', store=True)

            @api.depends('ssn')
            def _compute_ssn_encrypted(self):
                for record in self:
                    record.ssn_encrypted = encrypt(record.ssn) if record.ssn else ''

            @api.depends('ssn')
            def _compute_ssn_search(self):
                for record in self:
                    record.ssn_search = blind_index(record.ssn, 'ssn') if record.ssn else ''
    """
    pass


def encrypt_field(value: Any) -> str:
    """
    Chiffre une valeur de champ.

    Args:
        value: Valeur à chiffrer

    Returns:
        Valeur chiffrée ou chaîne vide
    """
    if value is None or value == '':
        return ''

    if isinstance(value, (int, float)):
        value = str(value)

    return encrypt(str(value))


def decrypt_field(encrypted_value: str) -> str:
    """
    Déchiffre une valeur de champ.

    Args:
        encrypted_value: Valeur chiffrée

    Returns:
        Valeur déchiffrée ou chaîne vide
    """
    if not encrypted_value:
        return ''

    try:
        return decrypt(encrypted_value)
    except Exception as e:
        _logger.error(f"Failed to decrypt field: {e}")
        return ''


# =============================================================================
# KEY ROTATION
# =============================================================================

class KeyRotation:
    """
    Gestion de la rotation des clés.

    Usage:
        rotation = KeyRotation()

        # Re-chiffrer avec nouvelle clé
        new_value = rotation.rotate_value(old_encrypted_value, new_key_id)

        # Re-chiffrer tous les enregistrements d'un modèle
        rotation.rotate_model(env, 'res.partner', 'ssn_encrypted')
    """

    def __init__(self, old_key: str = None, new_key: str = None):
        self.old_key = old_key or ENCRYPTION_KEY
        self.new_key = new_key or ENCRYPTION_KEY

    def rotate_value(
        self,
        encrypted_value: str,
        old_key_id: str,
        new_key_id: str
    ) -> str:
        """Re-chiffre une valeur avec une nouvelle clé"""
        if not encrypted_value:
            return ''

        # Déchiffrer avec l'ancienne clé
        old_key = derive_key(self.old_key, old_key_id)
        plaintext = decrypt(encrypted_value, old_key)

        # Re-chiffrer avec la nouvelle clé
        new_key = derive_key(self.new_key, new_key_id)

        # Modifier temporairement le key_id pour l'encryption
        global ENCRYPTION_KEY_ID
        original_key_id = ENCRYPTION_KEY_ID
        ENCRYPTION_KEY_ID = new_key_id

        try:
            return encrypt(plaintext, new_key)
        finally:
            ENCRYPTION_KEY_ID = original_key_id

    def rotate_model(
        self,
        env,
        model_name: str,
        field_name: str,
        old_key_id: str,
        new_key_id: str,
        batch_size: int = 100
    ) -> int:
        """
        Re-chiffre tous les enregistrements d'un modèle.

        Returns:
            Nombre d'enregistrements traités
        """
        Model = env[model_name].sudo()
        records = Model.search([(field_name, '!=', False)])

        count = 0
        for i in range(0, len(records), batch_size):
            batch = records[i:i + batch_size]

            for record in batch:
                old_value = getattr(record, field_name)
                if old_value:
                    new_value = self.rotate_value(old_value, old_key_id, new_key_id)
                    record.write({field_name: new_value})
                    count += 1

            # Commit par batch
            env.cr.commit()
            _logger.info(f"Rotated {count} records in {model_name}")

        return count


# =============================================================================
# HELPERS
# =============================================================================

def is_encrypted(value: str) -> bool:
    """Vérifie si une valeur est chiffrée"""
    if not value:
        return False

    # Format: {key_id}:{nonce}:{ciphertext}
    parts = value.split(':')
    if len(parts) == 3:
        return True

    # Fallback base64
    if value.startswith('b64:'):
        return True

    return False


def mask_sensitive(value: str, visible_chars: int = 4) -> str:
    """
    Masque une valeur sensible pour affichage.

    Args:
        value: Valeur à masquer
        visible_chars: Nombre de caractères visibles à la fin

    Returns:
        Valeur masquée (ex: ****1234)
    """
    if not value or len(value) <= visible_chars:
        return '*' * len(value) if value else ''

    return '*' * (len(value) - visible_chars) + value[-visible_chars:]

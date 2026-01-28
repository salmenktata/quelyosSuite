# -*- coding: utf-8 -*-
"""
Response Compression pour Quelyos API

Compression automatique des réponses:
- Gzip pour compatibilité maximale
- Brotli pour performances optimales
- Compression conditionnelle selon taille
"""

import gzip
import json
import logging
from functools import wraps
from typing import Any, Optional, Tuple

_logger = logging.getLogger(__name__)

# Configuration
MIN_COMPRESSION_SIZE = 1024  # Compresser si > 1KB
COMPRESSION_LEVEL = 6  # 1-9, 6 = bon compromis

# Essayer d'importer Brotli
try:
    import brotli
    BROTLI_AVAILABLE = True
except ImportError:
    BROTLI_AVAILABLE = False
    _logger.info("Brotli not available, using gzip only")


class CompressionType:
    """Types de compression supportés"""
    GZIP = 'gzip'
    BROTLI = 'br'
    NONE = 'identity'


def get_best_encoding(accept_encoding: str) -> str:
    """Détermine le meilleur encodage selon Accept-Encoding"""
    if not accept_encoding:
        return CompressionType.NONE

    accept = accept_encoding.lower()

    # Préférer Brotli si disponible
    if BROTLI_AVAILABLE and 'br' in accept:
        return CompressionType.BROTLI

    if 'gzip' in accept:
        return CompressionType.GZIP

    return CompressionType.NONE


def compress_gzip(data: bytes, level: int = COMPRESSION_LEVEL) -> bytes:
    """Compresse avec gzip"""
    return gzip.compress(data, compresslevel=level)


def compress_brotli(data: bytes, level: int = 4) -> bytes:
    """Compresse avec Brotli"""
    if not BROTLI_AVAILABLE:
        return compress_gzip(data)
    return brotli.compress(data, quality=level)


def compress_response(
    data: Any,
    accept_encoding: str = '',
    min_size: int = MIN_COMPRESSION_SIZE
) -> Tuple[bytes, str, bool]:
    """
    Compresse une réponse si nécessaire.

    Args:
        data: Données à compresser (dict, list, str, bytes)
        accept_encoding: Header Accept-Encoding du client
        min_size: Taille minimale pour compression

    Returns:
        Tuple (data_bytes, content_encoding, was_compressed)
    """
    # Convertir en bytes
    if isinstance(data, (dict, list)):
        data_bytes = json.dumps(data, ensure_ascii=False).encode('utf-8')
    elif isinstance(data, str):
        data_bytes = data.encode('utf-8')
    elif isinstance(data, bytes):
        data_bytes = data
    else:
        data_bytes = str(data).encode('utf-8')

    original_size = len(data_bytes)

    # Ne pas compresser si trop petit
    if original_size < min_size:
        return data_bytes, CompressionType.NONE, False

    # Déterminer encodage
    encoding = get_best_encoding(accept_encoding)

    if encoding == CompressionType.NONE:
        return data_bytes, CompressionType.NONE, False

    # Compresser
    try:
        if encoding == CompressionType.BROTLI:
            compressed = compress_brotli(data_bytes)
        else:
            compressed = compress_gzip(data_bytes)

        compressed_size = len(compressed)
        ratio = compressed_size / original_size

        # Ne compresser que si gain > 10%
        if ratio < 0.9:
            _logger.debug(
                f"Compressed {original_size} -> {compressed_size} "
                f"({ratio:.1%}) using {encoding}"
            )
            return compressed, encoding, True
        else:
            return data_bytes, CompressionType.NONE, False

    except Exception as e:
        _logger.warning(f"Compression failed: {e}")
        return data_bytes, CompressionType.NONE, False


def compressed_response(min_size: int = MIN_COMPRESSION_SIZE):
    """
    Décorateur pour compresser automatiquement les réponses.

    Usage:
        @compressed_response()
        def get_large_data(self, **kwargs):
            return {'data': [...]}
    """
    def decorator(func):
        @wraps(func)
        def wrapper(self, *args, **kwargs):
            from odoo.http import request, Response

            result = func(self, *args, **kwargs)

            # Obtenir Accept-Encoding
            accept_encoding = request.httprequest.headers.get(
                'Accept-Encoding', ''
            )

            # Compresser
            compressed, encoding, was_compressed = compress_response(
                result, accept_encoding, min_size
            )

            # Créer réponse avec headers appropriés
            headers = {
                'Content-Type': 'application/json; charset=utf-8',
                'Vary': 'Accept-Encoding',
            }

            if was_compressed:
                headers['Content-Encoding'] = encoding

            return Response(
                compressed,
                status=200,
                headers=headers
            )

        return wrapper
    return decorator


class StreamingCompressor:
    """Compresseur pour réponses streaming"""

    def __init__(self, encoding: str = CompressionType.GZIP):
        self.encoding = encoding
        self._buffer = []
        self._compressor = None

        if encoding == CompressionType.GZIP:
            import io
            self._buffer_io = io.BytesIO()
            self._compressor = gzip.GzipFile(
                fileobj=self._buffer_io,
                mode='wb'
            )
        elif encoding == CompressionType.BROTLI and BROTLI_AVAILABLE:
            self._compressor = brotli.Compressor()

    def write(self, data: bytes) -> bytes:
        """Écrit et retourne les données compressées disponibles"""
        if self.encoding == CompressionType.NONE:
            return data

        if self.encoding == CompressionType.GZIP:
            self._compressor.write(data)
            result = self._buffer_io.getvalue()
            self._buffer_io.seek(0)
            self._buffer_io.truncate()
            return result

        elif self.encoding == CompressionType.BROTLI:
            return self._compressor.process(data)

        return data

    def finish(self) -> bytes:
        """Finalise la compression et retourne les données restantes"""
        if self.encoding == CompressionType.NONE:
            return b''

        if self.encoding == CompressionType.GZIP:
            self._compressor.close()
            return self._buffer_io.getvalue()

        elif self.encoding == CompressionType.BROTLI:
            return self._compressor.finish()

        return b''

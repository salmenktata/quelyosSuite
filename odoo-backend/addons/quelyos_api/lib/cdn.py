# -*- coding: utf-8 -*-
"""
CDN Integration pour Quelyos API

Gestion du cache CDN:
- Purge sélective
- Cache warming
- Headers de cache
- Multi-CDN support
"""

import os
import json
import hashlib
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
from dataclasses import dataclass
from enum import Enum
import urllib.request
import urllib.error

_logger = logging.getLogger(__name__)


class CDNProvider(Enum):
    """Fournisseurs CDN supportés"""
    CLOUDFLARE = 'cloudflare'
    FASTLY = 'fastly'
    CLOUDFRONT = 'cloudfront'
    BUNNY = 'bunny'
    CUSTOM = 'custom'


@dataclass
class CDNConfig:
    """Configuration CDN"""
    provider: CDNProvider
    zone_id: str = ''
    api_key: str = ''
    api_email: str = ''
    base_url: str = ''
    purge_endpoint: str = ''


class CDNManager:
    """Gestionnaire CDN multi-provider"""

    def __init__(self):
        self._configs: Dict[str, CDNConfig] = {}
        self._primary: Optional[str] = None
        self._load_config()

    def _load_config(self):
        """Charge la configuration depuis les variables d'environnement"""
        # Cloudflare
        if os.environ.get('CLOUDFLARE_API_KEY'):
            self._configs['cloudflare'] = CDNConfig(
                provider=CDNProvider.CLOUDFLARE,
                zone_id=os.environ.get('CLOUDFLARE_ZONE_ID', ''),
                api_key=os.environ.get('CLOUDFLARE_API_KEY', ''),
                api_email=os.environ.get('CLOUDFLARE_EMAIL', ''),
            )
            self._primary = 'cloudflare'

        # Fastly
        if os.environ.get('FASTLY_API_KEY'):
            self._configs['fastly'] = CDNConfig(
                provider=CDNProvider.FASTLY,
                api_key=os.environ.get('FASTLY_API_KEY', ''),
                zone_id=os.environ.get('FASTLY_SERVICE_ID', ''),
            )
            if not self._primary:
                self._primary = 'fastly'

        # Bunny CDN
        if os.environ.get('BUNNY_API_KEY'):
            self._configs['bunny'] = CDNConfig(
                provider=CDNProvider.BUNNY,
                api_key=os.environ.get('BUNNY_API_KEY', ''),
                zone_id=os.environ.get('BUNNY_ZONE_ID', ''),
            )
            if not self._primary:
                self._primary = 'bunny'

    def register_cdn(self, name: str, config: CDNConfig):
        """Enregistre un CDN"""
        self._configs[name] = config
        if not self._primary:
            self._primary = name

    def purge_url(self, url: str, cdn_name: str = None) -> bool:
        """Purge une URL spécifique"""
        cdn = cdn_name or self._primary
        if not cdn or cdn not in self._configs:
            _logger.warning("No CDN configured for purge")
            return False

        config = self._configs[cdn]

        try:
            if config.provider == CDNProvider.CLOUDFLARE:
                return self._purge_cloudflare([url], config)
            elif config.provider == CDNProvider.FASTLY:
                return self._purge_fastly([url], config)
            elif config.provider == CDNProvider.BUNNY:
                return self._purge_bunny([url], config)
            else:
                return self._purge_custom([url], config)
        except Exception as e:
            _logger.error(f"CDN purge failed: {e}")
            return False

    def purge_urls(self, urls: List[str], cdn_name: str = None) -> bool:
        """Purge plusieurs URLs"""
        cdn = cdn_name or self._primary
        if not cdn or cdn not in self._configs:
            return False

        config = self._configs[cdn]

        try:
            if config.provider == CDNProvider.CLOUDFLARE:
                return self._purge_cloudflare(urls, config)
            elif config.provider == CDNProvider.FASTLY:
                return self._purge_fastly(urls, config)
            elif config.provider == CDNProvider.BUNNY:
                return self._purge_bunny(urls, config)
            else:
                return self._purge_custom(urls, config)
        except Exception as e:
            _logger.error(f"CDN purge failed: {e}")
            return False

    def purge_pattern(self, pattern: str, cdn_name: str = None) -> bool:
        """Purge par pattern (wildcard)"""
        cdn = cdn_name or self._primary
        if not cdn or cdn not in self._configs:
            return False

        config = self._configs[cdn]

        # Cloudflare supporte les purges par préfixe
        if config.provider == CDNProvider.CLOUDFLARE:
            return self._purge_cloudflare_prefix(pattern, config)

        _logger.warning(f"Pattern purge not supported for {config.provider}")
        return False

    def purge_all(self, cdn_name: str = None) -> bool:
        """Purge tout le cache"""
        cdn = cdn_name or self._primary
        if not cdn or cdn not in self._configs:
            return False

        config = self._configs[cdn]

        try:
            if config.provider == CDNProvider.CLOUDFLARE:
                return self._purge_cloudflare_all(config)
            elif config.provider == CDNProvider.FASTLY:
                return self._purge_fastly_all(config)
            elif config.provider == CDNProvider.BUNNY:
                return self._purge_bunny_all(config)
        except Exception as e:
            _logger.error(f"CDN purge all failed: {e}")

        return False

    def _purge_cloudflare(self, urls: List[str], config: CDNConfig) -> bool:
        """Purge Cloudflare"""
        endpoint = f"https://api.cloudflare.com/client/v4/zones/{config.zone_id}/purge_cache"
        data = json.dumps({'files': urls}).encode()

        req = urllib.request.Request(
            endpoint,
            data=data,
            headers={
                'X-Auth-Email': config.api_email,
                'X-Auth-Key': config.api_key,
                'Content-Type': 'application/json',
            },
            method='POST'
        )

        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read())
            return result.get('success', False)

    def _purge_cloudflare_all(self, config: CDNConfig) -> bool:
        """Purge tout Cloudflare"""
        endpoint = f"https://api.cloudflare.com/client/v4/zones/{config.zone_id}/purge_cache"
        data = json.dumps({'purge_everything': True}).encode()

        req = urllib.request.Request(
            endpoint,
            data=data,
            headers={
                'X-Auth-Email': config.api_email,
                'X-Auth-Key': config.api_key,
                'Content-Type': 'application/json',
            },
            method='POST'
        )

        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read())
            return result.get('success', False)

    def _purge_cloudflare_prefix(self, prefix: str, config: CDNConfig) -> bool:
        """Purge Cloudflare par préfixe"""
        endpoint = f"https://api.cloudflare.com/client/v4/zones/{config.zone_id}/purge_cache"
        data = json.dumps({'prefixes': [prefix]}).encode()

        req = urllib.request.Request(
            endpoint,
            data=data,
            headers={
                'X-Auth-Email': config.api_email,
                'X-Auth-Key': config.api_key,
                'Content-Type': 'application/json',
            },
            method='POST'
        )

        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read())
            return result.get('success', False)

    def _purge_fastly(self, urls: List[str], config: CDNConfig) -> bool:
        """Purge Fastly"""
        success = True
        for url in urls:
            req = urllib.request.Request(
                url,
                headers={'Fastly-Key': config.api_key},
                method='PURGE'
            )
            try:
                urllib.request.urlopen(req)
            except Exception:
                success = False
        return success

    def _purge_fastly_all(self, config: CDNConfig) -> bool:
        """Purge tout Fastly"""
        endpoint = f"https://api.fastly.com/service/{config.zone_id}/purge_all"
        req = urllib.request.Request(
            endpoint,
            headers={'Fastly-Key': config.api_key},
            method='POST'
        )
        urllib.request.urlopen(req)
        return True

    def _purge_bunny(self, urls: List[str], config: CDNConfig) -> bool:
        """Purge Bunny CDN"""
        for url in urls:
            endpoint = f"https://api.bunny.net/purge?url={url}"
            req = urllib.request.Request(
                endpoint,
                headers={'AccessKey': config.api_key},
                method='POST'
            )
            urllib.request.urlopen(req)
        return True

    def _purge_bunny_all(self, config: CDNConfig) -> bool:
        """Purge tout Bunny CDN"""
        endpoint = f"https://api.bunny.net/pullzone/{config.zone_id}/purgeCache"
        req = urllib.request.Request(
            endpoint,
            headers={'AccessKey': config.api_key},
            method='POST'
        )
        urllib.request.urlopen(req)
        return True

    def _purge_custom(self, urls: List[str], config: CDNConfig) -> bool:
        """Purge CDN custom"""
        if not config.purge_endpoint:
            return False

        data = json.dumps({'urls': urls}).encode()
        req = urllib.request.Request(
            config.purge_endpoint,
            data=data,
            headers={
                'Authorization': f'Bearer {config.api_key}',
                'Content-Type': 'application/json',
            },
            method='POST'
        )
        urllib.request.urlopen(req)
        return True

    def warm_cache(self, urls: List[str]) -> Dict[str, bool]:
        """Préchauffe le cache en requêtant les URLs"""
        results = {}
        for url in urls:
            try:
                req = urllib.request.Request(
                    url,
                    headers={'User-Agent': 'Quelyos-Cache-Warmer/1.0'}
                )
                urllib.request.urlopen(req, timeout=10)
                results[url] = True
            except Exception:
                results[url] = False
        return results


# Singleton
_cdn_manager = None


def get_cdn_manager() -> CDNManager:
    """Retourne le gestionnaire CDN"""
    global _cdn_manager
    if _cdn_manager is None:
        _cdn_manager = CDNManager()
    return _cdn_manager


def purge_on_change(url_pattern: str):
    """
    Décorateur pour purger le CDN après modification.

    Usage:
        @purge_on_change('/api/v1/products/{product_id}')
        def update_product(self, product_id, **kwargs):
            ...
    """
    from functools import wraps

    def decorator(func):
        @wraps(func)
        def wrapper(self, *args, **kwargs):
            result = func(self, *args, **kwargs)

            # Construire URL à purger
            url = url_pattern
            for i, arg in enumerate(args):
                url = url.replace(f'{{{i}}}', str(arg))
            for key, value in kwargs.items():
                url = url.replace(f'{{{key}}}', str(value))

            # Purger
            cdn = get_cdn_manager()
            cdn.purge_url(url)

            return result

        return wrapper
    return decorator

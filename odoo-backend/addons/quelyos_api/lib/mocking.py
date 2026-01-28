# -*- coding: utf-8 -*-
"""
API Mocking pour Quelyos API

Mock pour tests et développement:
- Mock de services externes
- Fixtures de données
- Replay de requêtes
"""

import os
import json
import re
import logging
from typing import Dict, List, Any, Optional, Callable
from datetime import datetime
from dataclasses import dataclass, field
from functools import wraps

_logger = logging.getLogger(__name__)

# Activer uniquement en dev/test
MOCK_ENABLED = os.environ.get('MOCK_ENABLED', 'false').lower() == 'true'
MOCK_PREFIX = 'quelyos:mock:'


@dataclass
class MockResponse:
    """Réponse mockée"""
    status: int = 200
    body: Any = None
    headers: Dict[str, str] = field(default_factory=dict)
    delay_ms: int = 0  # Simuler latence


@dataclass
class MockRule:
    """Règle de mock"""
    id: str
    method: str  # GET, POST, * pour tous
    path_pattern: str  # Regex ou exact
    response: MockResponse
    times: int = -1  # -1 = infini
    condition: Optional[Callable] = None


class MockServer:
    """Serveur de mock"""

    def __init__(self):
        self._rules: Dict[str, MockRule] = {}
        self._call_counts: Dict[str, int] = {}
        self._recorded: List[Dict] = []
        self._recording = False

    def add_rule(self, rule: MockRule):
        """Ajoute une règle de mock"""
        self._rules[rule.id] = rule
        self._call_counts[rule.id] = 0
        _logger.debug(f"Added mock rule: {rule.id}")

    def remove_rule(self, rule_id: str):
        """Supprime une règle"""
        self._rules.pop(rule_id, None)
        self._call_counts.pop(rule_id, None)

    def clear_rules(self):
        """Supprime toutes les règles"""
        self._rules.clear()
        self._call_counts.clear()

    def match(
        self,
        method: str,
        path: str,
        body: Any = None,
        headers: Dict = None
    ) -> Optional[MockResponse]:
        """
        Cherche une règle correspondante.

        Returns:
            MockResponse si match, None sinon
        """
        if not MOCK_ENABLED:
            return None

        for rule_id, rule in self._rules.items():
            # Check method
            if rule.method != '*' and rule.method.upper() != method.upper():
                continue

            # Check path
            if not self._match_path(rule.path_pattern, path):
                continue

            # Check condition
            if rule.condition and not rule.condition(method, path, body, headers):
                continue

            # Check times
            if rule.times != -1:
                if self._call_counts[rule_id] >= rule.times:
                    continue

            # Match!
            self._call_counts[rule_id] += 1

            # Delay si configuré
            if rule.response.delay_ms > 0:
                import time
                time.sleep(rule.response.delay_ms / 1000)

            return rule.response

        return None

    def _match_path(self, pattern: str, path: str) -> bool:
        """Vérifie si le chemin correspond au pattern"""
        # Exact match
        if pattern == path:
            return True

        # Regex match
        try:
            if re.match(pattern, path):
                return True
        except re.error:
            pass

        # Wildcard match
        if '*' in pattern:
            regex = pattern.replace('*', '.*')
            if re.match(f'^{regex}$', path):
                return True

        return False

    def start_recording(self):
        """Démarre l'enregistrement des appels"""
        self._recording = True
        self._recorded.clear()

    def stop_recording(self) -> List[Dict]:
        """Arrête l'enregistrement et retourne les appels"""
        self._recording = False
        return self._recorded.copy()

    def record_call(
        self,
        method: str,
        path: str,
        request_body: Any,
        response_status: int,
        response_body: Any
    ):
        """Enregistre un appel"""
        if not self._recording:
            return

        self._recorded.append({
            'timestamp': datetime.utcnow().isoformat(),
            'method': method,
            'path': path,
            'request_body': request_body,
            'response_status': response_status,
            'response_body': response_body,
        })

    def replay_recording(self, recording: List[Dict]):
        """Crée des règles à partir d'un enregistrement"""
        for i, call in enumerate(recording):
            rule = MockRule(
                id=f"replay_{i}",
                method=call['method'],
                path_pattern=call['path'],
                response=MockResponse(
                    status=call['response_status'],
                    body=call['response_body'],
                ),
                times=1,
            )
            self.add_rule(rule)

    def get_stats(self) -> Dict[str, Any]:
        """Retourne les statistiques"""
        return {
            'enabled': MOCK_ENABLED,
            'rules_count': len(self._rules),
            'call_counts': self._call_counts.copy(),
            'recording': self._recording,
            'recorded_count': len(self._recorded),
        }


# Singleton
_mock_server = None


def get_mock_server() -> MockServer:
    """Retourne le serveur de mock"""
    global _mock_server
    if _mock_server is None:
        _mock_server = MockServer()
    return _mock_server


def mock_response(
    path: str,
    method: str = '*',
    status: int = 200,
    body: Any = None,
    times: int = -1
):
    """
    Décorateur pour mocker une réponse.

    Usage:
        @mock_response('/api/external/payment', body={'status': 'success'})
        def test_payment():
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            server = get_mock_server()

            # Ajouter règle temporaire
            rule = MockRule(
                id=f"temp_{func.__name__}",
                method=method,
                path_pattern=path,
                response=MockResponse(status=status, body=body),
                times=times,
            )
            server.add_rule(rule)

            try:
                return func(*args, **kwargs)
            finally:
                server.remove_rule(rule.id)

        return wrapper
    return decorator


def with_mocking(func):
    """
    Décorateur pour activer le mocking sur un endpoint.

    Vérifie les règles de mock avant d'exécuter le code réel.
    """
    @wraps(func)
    def wrapper(self, *args, **kwargs):
        if not MOCK_ENABLED:
            return func(self, *args, **kwargs)

        from odoo.http import request

        # Extraire infos requête
        method = request.httprequest.method
        path = request.httprequest.path
        body = request.get_json_data() if hasattr(request, 'get_json_data') else None
        headers = dict(request.httprequest.headers)

        # Chercher mock
        server = get_mock_server()
        mock = server.match(method, path, body, headers)

        if mock:
            _logger.debug(f"Mock matched for {method} {path}")
            return mock.body

        return func(self, *args, **kwargs)

    return wrapper


class FixtureLoader:
    """Chargeur de fixtures pour tests"""

    def __init__(self, fixtures_dir: str = None):
        self._fixtures_dir = fixtures_dir or os.path.join(
            os.path.dirname(__file__), '..', 'fixtures'
        )
        self._cache: Dict[str, Any] = {}

    def load(self, name: str) -> Any:
        """Charge une fixture par nom"""
        if name in self._cache:
            return self._cache[name]

        # Chercher fichier
        for ext in ['.json', '.yaml', '.yml']:
            path = os.path.join(self._fixtures_dir, f"{name}{ext}")
            if os.path.exists(path):
                data = self._load_file(path)
                self._cache[name] = data
                return data

        raise FileNotFoundError(f"Fixture not found: {name}")

    def _load_file(self, path: str) -> Any:
        """Charge un fichier de fixture"""
        with open(path, 'r') as f:
            if path.endswith('.json'):
                return json.load(f)
            elif path.endswith(('.yaml', '.yml')):
                try:
                    import yaml
                    return yaml.safe_load(f)
                except ImportError:
                    raise ImportError("PyYAML required for YAML fixtures")

    def clear_cache(self):
        """Vide le cache"""
        self._cache.clear()


# Fixture loader singleton
_fixture_loader = None


def get_fixture_loader() -> FixtureLoader:
    """Retourne le chargeur de fixtures"""
    global _fixture_loader
    if _fixture_loader is None:
        _fixture_loader = FixtureLoader()
    return _fixture_loader

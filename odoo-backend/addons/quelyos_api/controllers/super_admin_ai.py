# -*- coding: utf-8 -*-
"""
Contrôleur Super Admin pour la gestion des providers IA.
Nécessite droits base.group_system (Super Admin).
"""
import logging
import json

from odoo import http
from odoo.http import request
from odoo.exceptions import AccessDenied
from ..lib.jwt_auth import validate_access_token, extract_bearer_token, InvalidTokenError, TokenExpiredError
from ..config import get_cors_headers

_logger = logging.getLogger(__name__)


class SuperAdminAiController(http.Controller):
    """
    API Super Admin pour CRUD providers IA et test connexions.
    Tous les endpoints nécessitent base.group_system.
    """

    def _check_super_admin(self):
        """
        Vérifie que l'utilisateur a les droits Super Admin via JWT Bearer.

        Raises:
            AccessDenied: Si l'utilisateur n'a pas les droits
        Returns:
            int: User ID si authentifié
        """
        # Extraire JWT Bearer token
        auth_header = request.httprequest.headers.get('Authorization')
        token = extract_bearer_token(auth_header)

        if not token:
            # Fallback: vérifier session Odoo classique
            if request.session.uid:
                user = request.env['res.users'].browse(request.session.uid)
                if user.has_group('base.group_system'):
                    return request.session.uid
            _logger.warning("[Super Admin AI] Pas de token JWT Bearer ni session valide")
            raise AccessDenied("Authentification requise (JWT Bearer)")

        try:
            # Valider le token JWT
            payload = validate_access_token(token)
            user_id = payload.get('uid')

            if not user_id:
                raise AccessDenied("Token invalide: uid manquant")

            # Vérifier que l'utilisateur a les droits super admin
            user = request.env['res.users'].sudo().browse(user_id)
            if not user.exists():
                raise AccessDenied("Utilisateur introuvable")

            if not user.has_group('base.group_system'):
                _logger.warning(f"[Super Admin AI] Accès refusé pour user {user.login}")
                raise AccessDenied("Droits Super Admin requis pour gérer les providers IA")

            return user_id

        except (TokenExpiredError, InvalidTokenError) as e:
            _logger.warning(f"[Super Admin AI] Erreur JWT: {e}")
            raise AccessDenied(f"Token invalide: {e}")

    @http.route('/api/super-admin/ai/providers', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def list_providers(self):
        """
        Liste tous les providers IA configurés.

        Returns:
            JSON: {
                'success': bool,
                'providers': [
                    {
                        'id': int,
                        'name': str,
                        'provider': str,
                        'is_enabled': bool,
                        'priority': int,
                        'model': str,
                        'max_tokens': int,
                        'temperature': float,
                        'has_api_key': bool,
                        'test_result': str|null,
                        'last_tested_at': str|null,
                        'total_requests': int,
                        'success_rate': float,
                        'avg_latency_ms': float,
                        'total_cost': float
                    }
                ]
            }
        """
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        # Handle preflight OPTIONS
        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        try:
            self._check_super_admin()

            AIConfig = request.env['quelyos.ai.config'].sudo()
            providers = AIConfig.search([])

            providers_data = []
            for provider in providers:
                providers_data.append({
                    'id': provider.id,
                    'name': provider.name,
                    'provider': provider.provider,
                    'is_enabled': provider.is_enabled,
                    'priority': provider.priority,
                    'model': provider.model or '',
                    'max_tokens': provider.max_tokens,
                    'temperature': provider.temperature,
                    'has_api_key': bool(provider.api_key_encrypted),
                    'test_result': provider.test_result or None,
                    'test_message': provider.test_message or '',
                    'last_tested_at': provider.last_tested_at.isoformat() if provider.last_tested_at else None,
                    'total_requests': provider.total_requests,
                    'success_rate': round(provider.success_rate, 2),
                    'avg_latency_ms': round(provider.avg_latency_ms, 2),
                    'total_cost': round(provider.total_cost, 6),
                    'created_at': provider.created_at.isoformat() if provider.created_at else None,
                    'updated_at': provider.updated_at.isoformat() if provider.updated_at else None,
                })

            _logger.info(f"[Super Admin AI] Liste de {len(providers_data)} providers récupérée")

            return request.make_json_response({
                'success': True,
                'providers': providers_data
            }, headers=cors_headers)

        except AccessDenied as e:
            return request.make_json_response({
                'success': False,
                'error': str(e)
            }, headers=cors_headers, status=403)

        except Exception as e:
            _logger.error(f"[Super Admin AI] Erreur liste providers: {e}", exc_info=True)
            return request.make_json_response({
                'success': False,
                'error': str(e)
            }, headers=cors_headers, status=500)

    @http.route('/api/super-admin/ai/providers/<int:provider_id>', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def get_provider(self, provider_id):
        """
        Récupère un provider spécifique.

        Args:
            provider_id (int): ID du provider

        Returns:
            JSON: {'success': bool, 'provider': dict}
        """
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        try:
            self._check_super_admin()

            AIConfig = request.env['quelyos.ai.config'].sudo()
            provider = AIConfig.browse(provider_id)

            if not provider.exists():
                return request.make_json_response({
                    'success': False,
                    'error': f'Provider {provider_id} introuvable'
                }, headers=cors_headers, status=404)

            # Masquer l'API key (afficher seulement début et fin)
            api_key_preview = None
            if provider.api_key_encrypted:
                try:
                    decrypted = provider.decrypt_api_key()
                    if len(decrypted) > 10:
                        api_key_preview = f"{decrypted[:4]}...{decrypted[-4:]}"
                    else:
                        api_key_preview = "****"
                except Exception:
                    api_key_preview = "****"

            provider_data = {
                'id': provider.id,
                'name': provider.name,
                'provider': provider.provider,
                'is_enabled': provider.is_enabled,
                'priority': provider.priority,
                'model': provider.model or '',
                'max_tokens': provider.max_tokens,
                'temperature': provider.temperature,
                'api_key_preview': api_key_preview,
                'test_result': provider.test_result or None,
                'test_message': provider.test_message or '',
                'last_tested_at': provider.last_tested_at.isoformat() if provider.last_tested_at else None,
                'total_requests': provider.total_requests,
                'failed_requests': provider.failed_requests,
                'success_rate': round(provider.success_rate, 2),
                'avg_latency_ms': round(provider.avg_latency_ms, 2),
                'total_tokens_used': provider.total_tokens_used,
                'total_cost': round(provider.total_cost, 6),
            }

            return request.make_json_response({
                'success': True,
                'provider': provider_data
            }, headers=cors_headers)

        except AccessDenied as e:
            return request.make_json_response({
                'success': False,
                'error': str(e)
            }, headers=cors_headers, status=403)

        except Exception as e:
            _logger.error(f"[Super Admin AI] Erreur get provider {provider_id}: {e}", exc_info=True)
            return request.make_json_response({
                'success': False,
                'error': str(e)
            }, headers=cors_headers, status=500)

    @http.route('/api/super-admin/ai/providers', type='http', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def create_provider(self):
        """
        Crée un nouveau provider IA.

        Args (JSON body):
            name (str): Nom du provider
            provider (str): Type (groq, claude, openai)
            api_key (str): API key en clair (sera chiffrée)
            is_enabled (bool): Activer le provider
            priority (int): Priorité pour fallback
            model (str): Nom du modèle
            max_tokens (int): Max tokens
            temperature (float): Température

        Returns:
            JSON: {'success': bool, 'provider_id': int}
        """
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        try:
            self._check_super_admin()

            # Parser le JSON body
            try:
                data = json.loads(request.httprequest.data.decode('utf-8'))
            except (json.JSONDecodeError, UnicodeDecodeError) as e:
                return request.make_json_response({
                    'success': False,
                    'error': f'JSON invalide: {str(e)}'
                }, headers=cors_headers, status=400)

            # Validation des champs requis
            required_fields = ['name', 'provider', 'api_key']
            for field in required_fields:
                if not data.get(field):
                    return request.make_json_response({
                        'success': False,
                        'error': f'Champ requis manquant: {field}'
                    }, headers=cors_headers, status=400)

            AIConfig = request.env['quelyos.ai.config'].sudo()

            # Créer le provider (api_key sera auto-chiffrée dans create())
            provider = AIConfig.create({
                'name': data['name'],
                'provider': data['provider'],
                'api_key_encrypted': data['api_key'],  # En clair, chiffré dans create()
                'is_enabled': data.get('is_enabled', False),
                'priority': data.get('priority', 1),
                'model': data.get('model', ''),
                'max_tokens': data.get('max_tokens', 800),
                'temperature': data.get('temperature', 0.7),
            })

            _logger.info(f"[Super Admin AI] Provider créé: {provider.name} (ID: {provider.id})")

            return request.make_json_response({
                'success': True,
                'provider_id': provider.id,
                'message': f'Provider {provider.name} créé avec succès'
            }, headers=cors_headers)

        except AccessDenied as e:
            return request.make_json_response({
                'success': False,
                'error': str(e)
            }, headers=cors_headers, status=403)

        except Exception as e:
            _logger.error(f"[Super Admin AI] Erreur création provider: {e}", exc_info=True)
            return request.make_json_response({
                'success': False,
                'error': str(e)
            }, headers=cors_headers, status=500)

    @http.route('/api/super-admin/ai/providers/<int:provider_id>', type='http', auth='public', methods=['PUT', 'OPTIONS'], csrf=False)
    def update_provider(self, provider_id):
        """
        Met à jour un provider existant.

        Args:
            provider_id (int): ID du provider
            JSON body: Champs à mettre à jour

        Returns:
            JSON: {'success': bool, 'message': str}
        """
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        try:
            self._check_super_admin()

            # Parser le JSON body
            try:
                data = json.loads(request.httprequest.data.decode('utf-8'))
            except (json.JSONDecodeError, UnicodeDecodeError) as e:
                return request.make_json_response({
                    'success': False,
                    'error': f'JSON invalide: {str(e)}'
                }, headers=cors_headers, status=400)

            AIConfig = request.env['quelyos.ai.config'].sudo()
            provider = AIConfig.browse(provider_id)

            if not provider.exists():
                return request.make_json_response({
                    'success': False,
                    'error': f'Provider {provider_id} introuvable'
                }, headers=cors_headers, status=404)

            # Préparer les valeurs à mettre à jour
            vals = {}
            updatable_fields = [
                'name', 'is_enabled', 'priority', 'model',
                'max_tokens', 'temperature'
            ]

            for field in updatable_fields:
                if field in data:
                    vals[field] = data[field]

            # API key si fournie (sera chiffrée dans write())
            if 'api_key' in data and data['api_key']:
                vals['api_key_encrypted'] = data['api_key']

            provider.write(vals)

            _logger.info(f"[Super Admin AI] Provider {provider.name} mis à jour")

            return request.make_json_response({
                'success': True,
                'message': f'Provider {provider.name} mis à jour avec succès'
            })

        except AccessDenied as e:
            return request.make_json_response({
                'success': False,
                'error': str(e)
            }, status=403)

        except Exception as e:
            _logger.error(f"[Super Admin AI] Erreur update provider {provider_id}: {e}", exc_info=True)
            return request.make_json_response({
                'success': False,
                'error': str(e)
            }, status=500)

    @http.route('/api/super-admin/ai/providers/<int:provider_id>', type='http', auth='public', methods=['DELETE', 'OPTIONS'], csrf=False)
    def delete_provider(self, provider_id):
        """
        Supprime un provider.

        Args:
            provider_id (int): ID du provider

        Returns:
            JSON: {'success': bool, 'message': str}
        """
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        try:
            self._check_super_admin()

            AIConfig = request.env['quelyos.ai.config'].sudo()
            provider = AIConfig.browse(provider_id)

            if not provider.exists():
                return request.make_json_response({
                    'success': False,
                    'error': f'Provider {provider_id} introuvable'
                }, headers=cors_headers, status=404)

            provider_name = provider.name
            provider.unlink()

            _logger.info(f"[Super Admin AI] Provider {provider_name} supprimé")

            return request.make_json_response({
                'success': True,
                'message': f'Provider {provider_name} supprimé avec succès'
            }, headers=cors_headers)

        except AccessDenied as e:
            return request.make_json_response({
                'success': False,
                'error': str(e)
            }, headers=cors_headers, status=403)

        except Exception as e:
            _logger.error(f"[Super Admin AI] Erreur suppression provider {provider_id}: {e}", exc_info=True)
            return request.make_json_response({
                'success': False,
                'error': str(e)
            }, headers=cors_headers, status=500)

    @http.route('/api/super-admin/ai/providers/<int:provider_id>/test', type='http', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def test_provider(self, provider_id):
        """
        Teste la connexion avec un provider.

        Args:
            provider_id (int): ID du provider

        Returns:
            JSON: {
                'success': bool,
                'message': str,
                'latency_ms': float,
                'test_result': str
            }
        """
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        try:
            self._check_super_admin()

            AIConfig = request.env['quelyos.ai.config'].sudo()
            provider = AIConfig.browse(provider_id)

            if not provider.exists():
                return request.make_json_response({
                    'success': False,
                    'error': f'Provider {provider_id} introuvable'
                }, headers=cors_headers, status=404)

            _logger.info(f"[Super Admin AI] Test connexion pour {provider.name}...")

            result = provider.test_connection()

            _logger.info(
                f"[Super Admin AI] Test {provider.name}: "
                f"{'✅ Succès' if result['success'] else '❌ Échec'} "
                f"({result.get('latency_ms', 0):.0f}ms)"
            )

            return request.make_json_response(result, headers=cors_headers)

        except AccessDenied as e:
            return request.make_json_response({
                'success': False,
                'error': str(e)
            }, headers=cors_headers, status=403)

        except Exception as e:
            _logger.error(f"[Super Admin AI] Erreur test provider {provider_id}: {e}", exc_info=True)
            return request.make_json_response({
                'success': False,
                'error': str(e),
                'latency_ms': 0
            }, headers=cors_headers, status=500)

    @http.route('/api/super-admin/ai/seed-defaults', type='http', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def seed_default_providers(self):
        """Insère ou met à jour la configuration par défaut des providers IA."""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        try:
            self._check_super_admin()

            AIConfig = request.env['quelyos.ai.config'].sudo()
            created = 0
            updated = 0

            defaults = [
                {
                    'name': 'Groq AI (Chatbot)',
                    'provider': 'groq',
                    'model': 'llama-3.1-70b-versatile',
                    'max_tokens': 800,
                    'temperature': 0.7,
                    'priority': 1,
                    'is_enabled': True,
                },
                {
                    'name': 'Groq Rapide (Fallback)',
                    'provider': 'groq',
                    'model': 'llama-3.1-8b-instant',
                    'max_tokens': 500,
                    'temperature': 0.5,
                    'priority': 2,
                    'is_enabled': False,
                },
                {
                    'name': 'Claude Sonnet (Premium)',
                    'provider': 'claude',
                    'model': 'claude-3-5-sonnet-20241022',
                    'max_tokens': 1024,
                    'temperature': 0.7,
                    'priority': 3,
                    'is_enabled': False,
                },
            ]

            for provider_data in defaults:
                existing = AIConfig.search([
                    ('name', '=', provider_data['name']),
                ], limit=1)

                # Ne pas écraser l'API key existante
                if existing:
                    update_vals = {k: v for k, v in provider_data.items() if k != 'name'}
                    # Garder is_enabled tel quel si le provider existe déjà
                    update_vals.pop('is_enabled', None)
                    existing.write(update_vals)
                    updated += 1
                else:
                    AIConfig.create(provider_data)
                    created += 1

            _logger.info(
                f"[Super Admin AI] Seed defaults - User: {request.env.user.login} | "
                f"Created: {created}, Updated: {updated}"
            )

            return request.make_json_response({
                'success': True,
                'message': f'{created} créés, {updated} mis à jour',
                'created': created,
                'updated': updated,
            }, headers=cors_headers)

        except AccessDenied as e:
            return request.make_json_response({
                'success': False,
                'error': str(e)
            }, headers=cors_headers, status=403)

        except Exception as e:
            _logger.error(f"[Super Admin AI] Erreur seed defaults: {e}", exc_info=True)
            return request.make_json_response({
                'success': False,
                'error': str(e)
            }, headers=cors_headers, status=500)

    @http.route('/api/super-admin/ai/metrics', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def get_metrics(self):
        """
        Récupère les métriques globales de tous les providers.

        Returns:
            JSON: {
                'success': bool,
                'metrics': {
                    'total_requests': int,
                    'total_tokens': int,
                    'total_cost': float,
                    'avg_success_rate': float,
                    'avg_latency_ms': float,
                    'providers_count': int,
                    'active_providers_count': int
                }
            }
        """
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        try:
            self._check_super_admin()

            AIConfig = request.env['quelyos.ai.config'].sudo()
            providers = AIConfig.search([])

            total_requests = sum(p.total_requests for p in providers)
            total_tokens = sum(p.total_tokens_used for p in providers)
            total_cost = sum(p.total_cost for p in providers)

            # Moyenne pondérée du success rate
            if total_requests > 0:
                weighted_success = sum(
                    p.success_rate * p.total_requests
                    for p in providers if p.total_requests > 0
                )
                avg_success_rate = weighted_success / total_requests
            else:
                avg_success_rate = 100.0

            # Moyenne pondérée de la latence
            if total_requests > 0:
                weighted_latency = sum(
                    p.avg_latency_ms * p.total_requests
                    for p in providers if p.total_requests > 0
                )
                avg_latency_ms = weighted_latency / total_requests
            else:
                avg_latency_ms = 0.0

            active_count = len(providers.filtered(lambda p: p.is_enabled))

            metrics = {
                'total_requests': total_requests,
                'total_tokens': total_tokens,
                'total_cost': round(total_cost, 6),
                'avg_success_rate': round(avg_success_rate, 2),
                'avg_latency_ms': round(avg_latency_ms, 2),
                'providers_count': len(providers),
                'active_providers_count': active_count,
            }

            return request.make_json_response({
                'success': True,
                'metrics': metrics
            }, headers=cors_headers)

        except AccessDenied as e:
            return request.make_json_response({
                'success': False,
                'error': str(e)
            }, headers=cors_headers, status=403)

        except Exception as e:
            _logger.error(f"[Super Admin AI] Erreur récupération métriques: {e}", exc_info=True)
            return request.make_json_response({
                'success': False,
                'error': str(e)
            }, headers=cors_headers, status=500)

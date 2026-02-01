# -*- coding: utf-8 -*-
"""
Contrôleur API publique pour la configuration IA.
Expose les endpoints utilisés par vitrine-quelyos pour récupérer la config active.
"""
import logging
import json
import time

from odoo import http
from odoo.http import request

from ..config import get_cors_headers
from ..lib.ai_security import (
    sanitize_user_message,
    sanitize_ai_response,
    check_rate_limit_chat,
    log_chat_interaction,
    SYSTEM_PROMPT_STRICT
)
from ..lib.ai_faq import get_faq_response, list_all_faq_questions

_logger = logging.getLogger(__name__)


class AiPublicController(http.Controller):
    """
    API publique pour récupération de la config IA active.
    Utilisée par vitrine-quelyos pour le chat assistant.
    """

    def _add_cors_headers(self, response):
        """
        Ajoute les headers CORS sécurisés pour permettre les requêtes cross-origin.
        Utilise la whitelist d'origines autorisées définie dans config.py.
        """
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        # Ajouter les headers CORS uniquement si l'origine est autorisée
        for header, value in cors_headers.items():
            response.headers[header] = value

        return response

    def _make_json_response_with_cors(self, data, status=200):
        """Créer une réponse JSON avec headers CORS."""
        response = request.make_json_response(data, status=status)
        return self._add_cors_headers(response)

    @http.route('/api/ai/active-config', type='jsonrpc', auth='public', csrf=False, methods=['POST'])
    def get_active_config(self):
        """
        Retourne la configuration du provider IA actif.

        Returns:
            dict: {
                'success': bool,
                'config': {
                    'id': int,
                    'provider': str,
                    'api_key': str,  # Déchiffrée
                    'model': str,
                    'max_tokens': int,
                    'temperature': float
                },
                'error': str  # Si échec
            }
        """
        try:
            AIConfig = request.env['quelyos.ai.config'].sudo()
            config_data = AIConfig.get_active_provider()

            if not config_data:
                _logger.warning("[AI Public] Aucun provider actif configuré")
                return {
                    'success': False,
                    'error': 'No active provider configured'
                }

            _logger.info(f"[AI Public] Config récupérée pour provider: {config_data['provider']}")

            return {
                'success': True,
                'config': config_data
            }

        except Exception as e:
            _logger.error(f"[AI Public] Erreur récupération config: {e}", exc_info=True)
            return {
                'success': False,
                'error': str(e)
            }

    @http.route('/api/ai/report-usage', type='jsonrpc', auth='public', csrf=False, methods=['POST'])
    def report_usage(self, **kwargs):
        """
        Reçoit les métriques d'usage depuis vitrine-quelyos.

        Args (kwargs):
            provider_id (int): ID du provider
            tokens_used (int): Tokens utilisés
            cost (float): Coût en USD
            latency_ms (float): Latence en ms
            success (bool): Si la requête a réussi

        Returns:
            dict: {'success': bool, 'error': str}
        """
        try:
            provider_id = kwargs.get('provider_id')
            tokens_used = kwargs.get('tokens_used', 0)
            cost = kwargs.get('cost', 0.0)
            latency_ms = kwargs.get('latency_ms', 0.0)
            success = kwargs.get('success', True)

            if not provider_id:
                return {
                    'success': False,
                    'error': 'provider_id requis'
                }

            AIConfig = request.env['quelyos.ai.config'].sudo()
            provider = AIConfig.browse(provider_id)

            if not provider.exists():
                return {
                    'success': False,
                    'error': f'Provider {provider_id} introuvable'
                }

            provider.increment_usage(
                tokens_used=tokens_used,
                cost=cost,
                latency_ms=latency_ms,
                success=success
            )

            _logger.debug(
                f"[AI Public] Métriques mises à jour pour {provider.name}: "
                f"{tokens_used} tokens, {latency_ms:.0f}ms"
            )

            return {'success': True}

        except Exception as e:
            _logger.error(f"[AI Public] Erreur rapport usage: {e}", exc_info=True)
            return {
                'success': False,
                'error': str(e)
            }

    @http.route('/api/ai/health', type='http', auth='public', csrf=False, methods=['GET'])
    def health_check(self):
        """
        Endpoint de santé pour vérifier que l'API IA est opérationnelle.

        Returns:
            JSON: {'status': 'ok', 'active_provider': str|null}
        """
        try:
            AIConfig = request.env['quelyos.ai.config'].sudo()
            config = AIConfig.get_active_provider()

            response_data = {
                'status': 'ok',
                'active_provider': config['provider'] if config else None,
                'timestamp': http.request.env['ir.http']._get_default_lang().iso_code
            }

            return self._make_json_response_with_cors(response_data)

        except Exception as e:
            _logger.error(f"[AI Public] Health check failed: {e}")
            return self._make_json_response_with_cors({
                'status': 'error',
                'error': str(e)
            }, status=500)

    @http.route('/api/ai/chat', type='http', auth='public', csrf=False, methods=['POST', 'OPTIONS'])
    def chat(self):
        """
        Endpoint de chat sécurisé avec filtrage des messages et réponses.

        Body (JSON):
            {
                "message": str,
                "conversation_history": list[dict] (optionnel)
            }

        Returns:
            JSON: {
                'success': bool,
                'response': str,
                'warning': str (optionnel si message suspect),
                'error': str (si échec)
            }
        """
        # Gérer OPTIONS pour CORS preflight
        if request.httprequest.method == 'OPTIONS':
            origin = request.httprequest.headers.get('Origin', '')
            cors_headers_dict = get_cors_headers(origin)

            # Convertir dict en liste de tuples pour make_response
            headers_list = [
                ('Access-Control-Allow-Methods', 'POST, OPTIONS'),
                ('Access-Control-Allow-Headers', 'Content-Type'),
                ('Access-Control-Max-Age', '3600')
            ]

            # Ajouter headers CORS uniquement si origine autorisée
            for header, value in cors_headers_dict.items():
                headers_list.append((header, value))

            response = request.make_response('', headers=headers_list)
            return response

        start_time = time.time()
        user_ip = request.httprequest.remote_addr

        try:
            # Parser le body JSON
            try:
                data = json.loads(request.httprequest.data.decode('utf-8'))
            except (json.JSONDecodeError, UnicodeDecodeError) as e:
                return self._make_json_response_with_cors({
                    'success': False,
                    'error': f'JSON invalide: {str(e)}'
                }, status=400)

            user_message = data.get('message', '').strip()
            if not user_message:
                return self._make_json_response_with_cors({
                    'success': False,
                    'error': 'Message requis'
                }, status=400)

            # Vérifier rate limiting
            is_authenticated = request.session.uid is not None
            rate_limit = check_rate_limit_chat(user_ip, is_authenticated)

            if not rate_limit['allowed']:
                _logger.warning(f"[AI Chat] Rate limit dépassé - IP: {user_ip}")
                return self._make_json_response_with_cors({
                    'success': False,
                    'error': 'Trop de requêtes. Réessayez plus tard.',
                    'retry_after': rate_limit.get('reset_at')
                }, status=429)

            # Sanitize le message utilisateur
            clean_message, is_suspicious = sanitize_user_message(user_message, user_ip)

            if is_suspicious:
                # Log mais ne bloque pas (on laisse l'IA répondre avec le system prompt strict)
                _logger.warning(
                    f"[AI Chat] Message suspect détecté - IP: {user_ip} - "
                    f"Message: {user_message[:100]}"
                )

            # Vérifier la FAQ d'abord (réponse instantanée)
            faq_response, faq_metadata = get_faq_response(clean_message)

            if faq_response:
                # Réponse trouvée dans la FAQ
                latency_ms = (time.time() - start_time) * 1000

                _logger.info(
                    f"[AI Chat] Réponse FAQ - IP: {user_ip} - "
                    f"Question: {faq_metadata['matched_question'][:50]} - "
                    f"Confidence: {faq_metadata['confidence']:.2f} - "
                    f"Latency: {latency_ms:.0f}ms"
                )

                return self._make_json_response_with_cors({
                    'success': True,
                    'response': faq_response,
                    'source': 'faq',
                    'confidence': faq_metadata['confidence']
                })

            # Pas de réponse FAQ → Appeler l'IA
            _logger.info(f"[AI Chat] Pas de match FAQ, appel IA - IP: {user_ip}")

            # Logger la question pour analyse future
            try:
                AiUnanswered = request.env['quelyos.ai.unanswered'].sudo()
                AiUnanswered.log_unanswered_question(clean_message, user_ip)
            except Exception as e:
                _logger.warning(f"[AI Chat] Erreur logging question: {e}")

            # Récupérer la config IA active
            AIConfig = request.env['quelyos.ai.config'].sudo()
            config = AIConfig.get_active_provider()

            if not config:
                return self._make_json_response_with_cors({
                    'success': False,
                    'error': 'Service temporairement indisponible'
                }, status=503)

            # Appeler l'IA avec le system prompt strict
            try:
                ai_response = self._call_ai_provider(
                    provider=config['provider'],
                    api_key=config['api_key'],
                    model=config['model'],
                    message=clean_message,
                    max_tokens=config.get('max_tokens', 800),
                    temperature=config.get('temperature', 0.7)
                )
            except Exception as e:
                _logger.error(f"[AI Chat] Erreur appel provider: {e}", exc_info=True)
                return self._make_json_response_with_cors({
                    'success': False,
                    'error': 'Erreur lors de la génération de la réponse'
                }, status=500)

            # Sanitize la réponse de l'IA (strict=True)
            safe_response = sanitize_ai_response(ai_response, strict=True)

            # Calculer la latence
            latency_ms = (time.time() - start_time) * 1000

            # Logger l'interaction
            log_chat_interaction(
                user_ip=user_ip,
                message=user_message,
                response=safe_response,
                is_suspicious=is_suspicious,
                provider=config['provider'],
                latency_ms=latency_ms
            )

            # Réponse
            response_data = {
                'success': True,
                'response': safe_response,
                'source': 'ai'  # Indiquer que ça vient de l'IA
            }

            if is_suspicious:
                response_data['warning'] = 'Votre message a été signalé pour vérification'

            return self._make_json_response_with_cors(response_data)

        except Exception as e:
            _logger.error(f"[AI Chat] Erreur inattendue: {e}", exc_info=True)
            return self._make_json_response_with_cors({
                'success': False,
                'error': 'Erreur interne du serveur'
            }, status=500)

    def _call_ai_provider(
        self,
        provider: str,
        api_key: str,
        model: str,
        message: str,
        max_tokens: int = 800,
        temperature: float = 0.7
    ) -> str:
        """
        Appelle le provider IA avec le system prompt strict.

        Args:
            provider: Type de provider (groq, claude, openai)
            api_key: Clé API déchiffrée
            model: Nom du modèle
            message: Message utilisateur (déjà sanitizé)
            max_tokens: Tokens max
            temperature: Température

        Returns:
            str: Réponse brute de l'IA

        Raises:
            Exception: Si l'appel échoue
        """
        if provider == 'groq':
            return self._call_groq(api_key, model, message, max_tokens, temperature)
        elif provider == 'claude':
            return self._call_claude(api_key, model, message, max_tokens, temperature)
        elif provider == 'openai':
            return self._call_openai(api_key, model, message, max_tokens, temperature)
        else:
            raise ValueError(f"Provider non supporté: {provider}")

    def _call_groq(self, api_key: str, model: str, message: str, max_tokens: int, temperature: float) -> str:
        """Appelle Groq API."""
        import requests

        try:
            response = requests.post(
                'https://api.groq.com/openai/v1/chat/completions',
                headers={
                    'Authorization': f'Bearer {api_key}',
                    'Content-Type': 'application/json'
                },
                json={
                    'model': model,
                    'messages': [
                        {'role': 'system', 'content': SYSTEM_PROMPT_STRICT},
                        {'role': 'user', 'content': message}
                    ],
                    'max_tokens': max_tokens,
                    'temperature': temperature
                },
                timeout=30
            )

            if not response.ok:
                error_detail = response.text[:500]
                _logger.error(f"[Groq API] Error {response.status_code}: {error_detail}")
                response.raise_for_status()

            return response.json()['choices'][0]['message']['content']
        except requests.exceptions.RequestException as e:
            _logger.error(f"[Groq API] Request failed: {str(e)}")
            raise

    def _call_claude(self, api_key: str, model: str, message: str, max_tokens: int, temperature: float) -> str:
        """Appelle Anthropic Claude API."""
        import requests

        response = requests.post(
            'https://api.anthropic.com/v1/messages',
            headers={
                'x-api-key': api_key,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json'
            },
            json={
                'model': model,
                'system': SYSTEM_PROMPT_STRICT,
                'messages': [
                    {'role': 'user', 'content': message}
                ],
                'max_tokens': max_tokens,
                'temperature': temperature
            },
            timeout=30
        )
        response.raise_for_status()
        return response.json()['content'][0]['text']

    def _call_openai(self, api_key: str, model: str, message: str, max_tokens: int, temperature: float) -> str:
        """Appelle OpenAI GPT API."""
        import requests

        response = requests.post(
            'https://api.openai.com/v1/chat/completions',
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            },
            json={
                'model': model,
                'messages': [
                    {'role': 'system', 'content': SYSTEM_PROMPT_STRICT},
                    {'role': 'user', 'content': message}
                ],
                'max_tokens': max_tokens,
                'temperature': temperature
            },
            timeout=30
        )
        response.raise_for_status()
        return response.json()['choices'][0]['message']['content']

    @http.route('/api/ai/faq', type='http', auth='public', csrf=False, methods=['GET', 'OPTIONS'])
    def get_faq_list(self):
        """
        Retourne la liste des questions fréquentes disponibles.

        Returns:
            JSON: {'success': bool, 'questions': list[str]}
        """
        try:
            questions = list_all_faq_questions()

            return self._make_json_response_with_cors({
                'success': True,
                'count': len(questions),
                'questions': questions
            })

        except Exception as e:
            _logger.error(f"[AI FAQ] Erreur liste FAQ: {e}")
            return self._make_json_response_with_cors({
                'success': False,
                'error': str(e)
            }, status=500)

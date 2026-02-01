# -*- coding: utf-8 -*-
import logging
import math
from datetime import datetime, timedelta
from odoo import http, fields
from odoo.http import request
from ..config import is_origin_allowed, get_cors_headers
from ..lib.cache import get_cache_service, CacheTTL
from ..lib.rate_limiter import check_rate_limit, RateLimitConfig
from ..lib.validation import sanitize_string, sanitize_dict, validate_no_injection
from .base import BaseController

_logger = logging.getLogger(__name__)


class QuelyosCrmAPI(BaseController):
    """API contrôleur pour le CRM (leads et opportunités)"""

    @http.route('/api/ecommerce/crm/stages', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_crm_stages(self, **kwargs):
        """Récupérer les stages (colonnes) du pipeline CRM pour un tenant"""
        try:
            params = self._get_params()
            tenant_id = params.get('tenant_id')

            Stage = request.env['crm.stage'].sudo()

            # Filtrer par tenant (stages du tenant + stages globaux)
            if tenant_id:
                domain = ['|', ('tenant_id', '=', tenant_id), ('tenant_id', '=', False)]
            else:
                domain = [('tenant_id', '=', False)]

            stages = Stage.search(domain, order='sequence asc')

            data = []
            for stage in stages:
                data.append({
                    'id': stage.id,
                    'name': stage.name,
                    'sequence': stage.sequence,
                    'fold': stage.fold,
                    'is_won': stage.is_won,
                    'tenant_id': stage.tenant_id.id if stage.tenant_id else None,
                    'is_global': not stage.tenant_id
                })

            return {
                'success': True,
                'data': data
            }

        except Exception as e:
            _logger.error(f"Get CRM stages error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Erreur serveur',
                'errorCode': 'SERVER_ERROR'
            }

    @http.route('/api/ecommerce/crm/leads', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_crm_leads(self, **kwargs):
        """Récupérer les leads (opportunités) avec pagination et filtrage par tenant"""
        try:
            params = self._get_params()
            limit = params.get('limit', 20)
            offset = params.get('offset', 0)
            search_term = params.get('search', '').strip()
            tenant_id = params.get('tenant_id')

            # tenant_id obligatoire pour isoler les données
            if not tenant_id:
                return {
                    'success': False,
                    'error': 'tenant_id est obligatoire',
                    'errorCode': 'MISSING_TENANT'
                }

            Lead = request.env['crm.lead'].sudo()

            # Construire domaine de recherche avec filtrage tenant
            domain = [('tenant_id', '=', tenant_id)]
            if search_term:
                domain += [
                    '|', '|',
                    ('name', 'ilike', search_term),
                    ('partner_name', 'ilike', search_term),
                    ('email_from', 'ilike', search_term)
                ]

            # Compter total
            total = Lead.search_count(domain)

            # Récupérer leads
            leads = Lead.search(domain, limit=limit, offset=offset, order='create_date desc')

            data = []
            for lead in leads:
                data.append({
                    'id': lead.id,
                    'name': lead.name,
                    'partner_id': lead.partner_id.id if lead.partner_id else None,
                    'partner_name': lead.partner_name or (lead.partner_id.name if lead.partner_id else None),
                    'stage_id': lead.stage_id.id if lead.stage_id else None,
                    'stage_name': lead.stage_id.name if lead.stage_id else 'Non défini',
                    'expected_revenue': lead.expected_revenue,
                    'probability': lead.probability,
                    'user_id': lead.user_id.id if lead.user_id else None,
                    'user_name': lead.user_id.name if lead.user_id else None,
                    'date_deadline': lead.date_deadline.isoformat() if lead.date_deadline else None,
                    'create_date': lead.create_date.isoformat() if lead.create_date else None,
                    'tenant_id': lead.tenant_id.id if lead.tenant_id else None
                })

            return {
                'success': True,
                'data': data,
                'pagination': {
                    'total': total,
                    'limit': limit,
                    'offset': offset
                }
            }

        except Exception as e:
            _logger.error(f"Get CRM leads error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Erreur serveur',
                'errorCode': 'SERVER_ERROR'
            }

    @http.route('/api/ecommerce/crm/leads/<int:lead_id>', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_crm_lead_detail(self, lead_id, **kwargs):
        """Récupérer le détail d'un lead avec vérification tenant"""
        try:
            params = self._get_params()
            tenant_id = params.get('tenant_id')

            Lead = request.env['crm.lead'].sudo()
            lead = Lead.browse(lead_id)

            if not lead.exists():
                return {
                    'success': False,
                    'error': 'Lead introuvable',
                    'errorCode': 'NOT_FOUND'
                }

            # Vérifier appartenance au tenant
            if tenant_id and lead.tenant_id and lead.tenant_id.id != tenant_id:
                return {
                    'success': False,
                    'error': 'Lead non accessible pour ce tenant',
                    'errorCode': 'FORBIDDEN'
                }

            return {
                'success': True,
                'data': {
                    'id': lead.id,
                    'name': lead.name,
                    'partner_id': lead.partner_id.id if lead.partner_id else None,
                    'partner_name': lead.partner_name or (lead.partner_id.name if lead.partner_id else None),
                    'stage_id': lead.stage_id.id if lead.stage_id else None,
                    'stage_name': lead.stage_id.name if lead.stage_id else 'Non défini',
                    'expected_revenue': lead.expected_revenue,
                    'probability': lead.probability,
                    'user_id': lead.user_id.id if lead.user_id else None,
                    'user_name': lead.user_id.name if lead.user_id else None,
                    'date_deadline': lead.date_deadline.isoformat() if lead.date_deadline else None,
                    'create_date': lead.create_date.isoformat() if lead.create_date else None,
                    'write_date': lead.write_date.isoformat() if lead.write_date else None,
                    'description': lead.description or '',
                    'email': lead.email_from or '',
                    'phone': lead.phone or '',
                    'mobile': lead.mobile or '',
                    'tenant_id': lead.tenant_id.id if lead.tenant_id else None
                }
            }

        except Exception as e:
            _logger.error(f"Get CRM lead detail error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Erreur serveur',
                'errorCode': 'SERVER_ERROR'
            }

    @http.route('/api/ecommerce/crm/leads/create', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def create_crm_lead(self, **kwargs):
        """Créer un nouveau lead avec tenant obligatoire"""
        try:
            # Vérifier session
            session_error = self._check_session()
            if session_error:
                return session_error

            params = self._get_params()
            name = params.get('name', '').strip()
            tenant_id = params.get('tenant_id')

            if not name:
                return {
                    'success': False,
                    'error': 'Le nom de l\'opportunité est obligatoire',
                    'errorCode': 'MISSING_REQUIRED_FIELD'
                }

            if not tenant_id:
                return {
                    'success': False,
                    'error': 'tenant_id est obligatoire',
                    'errorCode': 'MISSING_TENANT'
                }

            # Vérifier que le tenant existe
            Tenant = request.env['quelyos.tenant'].sudo()
            if not Tenant.browse(tenant_id).exists():
                return {
                    'success': False,
                    'error': 'Tenant introuvable',
                    'errorCode': 'INVALID_TENANT'
                }

            Lead = request.env['crm.lead'].sudo()

            # Construire valeurs
            vals = {
                'name': name,
                'user_id': request.session.uid,
                'tenant_id': tenant_id
            }

            # Champs optionnels
            if params.get('partner_id'):
                vals['partner_id'] = params['partner_id']
            if params.get('stage_id'):
                vals['stage_id'] = params['stage_id']
            if params.get('expected_revenue'):
                vals['expected_revenue'] = float(params['expected_revenue'])
            if params.get('probability') is not None:
                vals['probability'] = float(params['probability'])
            if params.get('date_deadline'):
                vals['date_deadline'] = params['date_deadline']
            if params.get('description'):
                vals['description'] = params['description']
            if params.get('email'):
                vals['email_from'] = params['email']
            if params.get('phone'):
                vals['phone'] = params['phone']
            if params.get('mobile'):
                vals['mobile'] = params['mobile']

            # Créer lead
            lead = Lead.create(vals)
            _logger.info(f"CRM lead created: {lead.name} (id: {lead.id}) for tenant {tenant_id}")

            return {
                'success': True,
                'data': {
                    'id': lead.id,
                    'name': lead.name,
                    'stage_id': lead.stage_id.id if lead.stage_id else None,
                    'stage_name': lead.stage_id.name if lead.stage_id else 'Non défini',
                    'tenant_id': lead.tenant_id.id
                }
            }

        except Exception as e:
            _logger.error(f"Create CRM lead error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Erreur serveur',
                'errorCode': 'SERVER_ERROR'
            }

    @http.route('/api/ecommerce/crm/leads/<int:lead_id>/update', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def update_crm_lead(self, lead_id, **kwargs):
        """Mettre à jour un lead avec vérification tenant"""
        try:
            # Vérifier session
            session_error = self._check_session()
            if session_error:
                return session_error

            params = self._get_params()
            tenant_id = params.get('tenant_id')

            Lead = request.env['crm.lead'].sudo()
            lead = Lead.browse(lead_id)

            if not lead.exists():
                return {
                    'success': False,
                    'error': 'Lead introuvable',
                    'errorCode': 'NOT_FOUND'
                }

            # Vérifier appartenance au tenant
            if tenant_id and lead.tenant_id and lead.tenant_id.id != tenant_id:
                return {
                    'success': False,
                    'error': 'Lead non accessible pour ce tenant',
                    'errorCode': 'FORBIDDEN'
                }

            # Construire dict de mise à jour
            update_vals = {}

            if 'name' in params and params['name'].strip():
                update_vals['name'] = params['name'].strip()
            if 'partner_id' in params:
                update_vals['partner_id'] = params['partner_id'] or False
            if 'stage_id' in params:
                update_vals['stage_id'] = params['stage_id']
            if 'expected_revenue' in params:
                update_vals['expected_revenue'] = float(params['expected_revenue']) if params['expected_revenue'] else 0
            if 'probability' in params:
                update_vals['probability'] = float(params['probability']) if params['probability'] is not None else 0
            if 'date_deadline' in params:
                update_vals['date_deadline'] = params['date_deadline'] or False
            if 'description' in params:
                update_vals['description'] = params['description']
            if 'email' in params:
                update_vals['email_from'] = params['email']
            if 'phone' in params:
                update_vals['phone'] = params['phone']
            if 'mobile' in params:
                update_vals['mobile'] = params['mobile']

            if update_vals:
                lead.write(update_vals)
                _logger.info(f"CRM lead updated: {lead.id}")

            return {
                'success': True,
                'data': {
                    'id': lead.id,
                    'name': lead.name,
                    'expected_revenue': lead.expected_revenue,
                    'probability': lead.probability
                }
            }

        except Exception as e:
            _logger.error(f"Update CRM lead error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Erreur serveur',
                'errorCode': 'SERVER_ERROR'
            }

    @http.route('/api/ecommerce/crm/leads/<int:lead_id>/stage', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def update_lead_stage(self, lead_id, **kwargs):
        """Mettre à jour le stage d'un lead (drag & drop) avec vérification tenant"""
        try:
            # Vérifier session
            session_error = self._check_session()
            if session_error:
                return session_error

            params = self._get_params()
            stage_id = params.get('stage_id')
            tenant_id = params.get('tenant_id')

            if not stage_id:
                return {
                    'success': False,
                    'error': 'Le stage_id est obligatoire',
                    'errorCode': 'MISSING_REQUIRED_FIELD'
                }

            Lead = request.env['crm.lead'].sudo()
            lead = Lead.browse(lead_id)

            if not lead.exists():
                return {
                    'success': False,
                    'error': 'Lead introuvable',
                    'errorCode': 'NOT_FOUND'
                }

            # Vérifier appartenance au tenant
            if tenant_id and lead.tenant_id and lead.tenant_id.id != tenant_id:
                return {
                    'success': False,
                    'error': 'Lead non accessible pour ce tenant',
                    'errorCode': 'FORBIDDEN'
                }

            # Vérifier que le stage existe
            Stage = request.env['crm.stage'].sudo()
            stage = Stage.browse(stage_id)
            if not stage.exists():
                return {
                    'success': False,
                    'error': 'Stage introuvable',
                    'errorCode': 'NOT_FOUND'
                }

            # Vérifier que le stage appartient au même tenant ou est global
            if stage.tenant_id and lead.tenant_id and stage.tenant_id.id != lead.tenant_id.id:
                return {
                    'success': False,
                    'error': 'Stage non accessible pour ce tenant',
                    'errorCode': 'FORBIDDEN'
                }

            # Mettre à jour le stage
            lead.write({'stage_id': stage_id})
            _logger.info(f"CRM lead {lead.id} moved to stage {stage.name}")

            return {
                'success': True,
                'data': {
                    'id': lead.id,
                    'stage_id': stage.id,
                    'stage_name': stage.name,
                    'tenant_id': lead.tenant_id.id if lead.tenant_id else None
                }
            }

        except Exception as e:
            _logger.error(f"Update lead stage error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Erreur serveur',
                'errorCode': 'SERVER_ERROR'
            }

    @http.route('/api/ecommerce/crm/stages/create', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def create_crm_stage(self, **kwargs):
        """Créer un nouveau stage CRM pour un tenant"""
        try:
            # Vérifier session
            session_error = self._check_session()
            if session_error:
                return session_error

            params = self._get_params()
            name = params.get('name', '').strip()
            tenant_id = params.get('tenant_id')

            if not name:
                return {
                    'success': False,
                    'error': 'Le nom du stage est obligatoire',
                    'errorCode': 'MISSING_REQUIRED_FIELD'
                }

            if not tenant_id:
                return {
                    'success': False,
                    'error': 'tenant_id est obligatoire',
                    'errorCode': 'MISSING_TENANT'
                }

            # Vérifier que le tenant existe
            Tenant = request.env['quelyos.tenant'].sudo()
            if not Tenant.browse(tenant_id).exists():
                return {
                    'success': False,
                    'error': 'Tenant introuvable',
                    'errorCode': 'INVALID_TENANT'
                }

            Stage = request.env['crm.stage'].sudo()

            # Calculer la séquence (après le dernier stage du tenant)
            last_stage = Stage.search([
                '|',
                ('tenant_id', '=', tenant_id),
                ('tenant_id', '=', False)
            ], order='sequence desc', limit=1)
            sequence = (last_stage.sequence + 10) if last_stage else 10

            # Créer le stage
            stage = Stage.create({
                'name': name,
                'tenant_id': tenant_id,
                'sequence': sequence,
                'fold': params.get('fold', False),
                'is_won': params.get('is_won', False),
            })
            _logger.info(f"CRM stage created: {stage.name} (id: {stage.id}) for tenant {tenant_id}")

            return {
                'success': True,
                'data': {
                    'id': stage.id,
                    'name': stage.name,
                    'sequence': stage.sequence,
                    'fold': stage.fold,
                    'is_won': stage.is_won,
                    'tenant_id': stage.tenant_id.id
                }
            }

        except Exception as e:
            _logger.error(f"Create CRM stage error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Erreur serveur',
                'errorCode': 'SERVER_ERROR'
            }

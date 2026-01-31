# -*- coding: utf-8 -*-
"""
API REST Marketing Automation.

Endpoints :
- GET /api/ecommerce/marketing/automations - Liste workflows
- POST /api/ecommerce/marketing/automations/create - Créer workflow
- GET /api/ecommerce/marketing/automations/:id - Détail workflow
- POST /api/ecommerce/marketing/automations/:id/start - Activer workflow
- POST /api/ecommerce/marketing/automations/:id/stop - Désactiver workflow
- POST /api/ecommerce/marketing/automations/:id/add-participant - Ajouter participant
- GET /api/ecommerce/marketing/automations/:id/participants - Liste participants
- DELETE /api/ecommerce/marketing/automations/:id/delete - Supprimer workflow
"""

from odoo import http
from odoo.http import request


class MarketingAutomationController(http.Controller):
    """API REST Marketing Automation."""

    @http.route('/api/ecommerce/marketing/automations', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def list_automations(self, tenant_id=None, active_only=False, limit=100, offset=0, **kwargs):
        """Liste workflows automation."""
        try:
            domain = []
            if tenant_id:
                domain.append(('company_id', '=', tenant_id))
            if active_only:
                domain.append(('active', '=', True))

            Automation = request.env['quelyos.marketing.automation'].sudo()
            total_count = Automation.search_count(domain)
            automations = Automation.search(domain, limit=limit, offset=offset, order='sequence, name')

            automations_data = []
            for automation in automations:
                automations_data.append({
                    'id': automation.id,
                    'name': automation.name,
                    'active': automation.active,
                    'trigger_type': automation.trigger_type,
                    'participant_count': automation.participant_count,
                    'active_participant_count': automation.active_participant_count,
                    'completed_participant_count': automation.completed_participant_count,
                    'activity_count': len(automation.activity_ids),
                })

            return {
                'success': True,
                'automations': automations_data,
                'total_count': total_count,
            }

        except Exception as e:
            return {'success': False, 'error': str(e)}

    @http.route('/api/ecommerce/marketing/automations/<int:automation_id>', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_automation(self, automation_id, **kwargs):
        """Détail workflow avec activités."""
        try:
            automation = request.env['quelyos.marketing.automation'].sudo().browse(automation_id)
            if not automation.exists():
                return {'success': False, 'error': 'Automation not found'}

            # Récupérer activités
            activities_data = []
            for activity in automation.activity_ids.sorted('sequence'):
                activities_data.append({
                    'id': activity.id,
                    'name': activity.name,
                    'sequence': activity.sequence,
                    'activity_type': activity.activity_type,
                    'wait_days': activity.wait_days,
                    'wait_hours': activity.wait_hours,
                })

            return {
                'success': True,
                'automation': {
                    'id': automation.id,
                    'name': automation.name,
                    'active': automation.active,
                    'trigger_type': automation.trigger_type,
                    'filter_domain': automation.filter_domain,
                    'participant_count': automation.participant_count,
                    'active_participant_count': automation.active_participant_count,
                    'completed_participant_count': automation.completed_participant_count,
                    'activities': activities_data,
                },
            }

        except Exception as e:
            return {'success': False, 'error': str(e)}

    @http.route('/api/ecommerce/marketing/automations/<int:automation_id>/participants', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def list_participants(self, automation_id, state=None, limit=100, offset=0, **kwargs):
        """Liste participants d'un workflow."""
        try:
            domain = [('automation_id', '=', automation_id)]
            if state:
                domain.append(('state', '=', state))

            Participant = request.env['quelyos.marketing.automation.participant'].sudo()
            total_count = Participant.search_count(domain)
            participants = Participant.search(domain, limit=limit, offset=offset)

            participants_data = []
            for participant in participants:
                participants_data.append({
                    'id': participant.id,
                    'partner_id': participant.partner_id.id,
                    'partner_name': participant.partner_id.name,
                    'partner_email': participant.partner_id.email,
                    'state': participant.state,
                    'activities_done': participant.activities_done,
                    'activities_total': participant.activities_total,
                    'progress_percent': participant.progress_percent,
                    'current_activity': participant.current_activity_id.name if participant.current_activity_id else None,
                    'next_activity_date': participant.next_activity_date.isoformat() if participant.next_activity_date else None,
                })

            return {
                'success': True,
                'participants': participants_data,
                'total_count': total_count,
            }

        except Exception as e:
            return {'success': False, 'error': str(e)}

    @http.route('/api/ecommerce/marketing/automations/<int:automation_id>/start', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def start_automation(self, automation_id, **kwargs):
        """Active un workflow."""
        try:
            automation = request.env['quelyos.marketing.automation'].sudo().browse(automation_id)
            if not automation.exists():
                return {'success': False, 'error': 'Automation not found'}

            automation.action_start()

            return {'success': True, 'active': automation.active}

        except Exception as e:
            return {'success': False, 'error': str(e)}

    @http.route('/api/ecommerce/marketing/automations/<int:automation_id>/stop', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def stop_automation(self, automation_id, **kwargs):
        """Désactive un workflow."""
        try:
            automation = request.env['quelyos.marketing.automation'].sudo().browse(automation_id)
            if not automation.exists():
                return {'success': False, 'error': 'Automation not found'}

            automation.action_stop()

            return {'success': True, 'active': automation.active}

        except Exception as e:
            return {'success': False, 'error': str(e)}

    @http.route('/api/ecommerce/marketing/automations/<int:automation_id>/add-participant', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def add_participant(self, automation_id, partner_id, **kwargs):
        """Ajoute un participant au workflow."""
        try:
            automation = request.env['quelyos.marketing.automation'].sudo().browse(automation_id)
            if not automation.exists():
                return {'success': False, 'error': 'Automation not found'}

            participant = automation.add_participant(partner_id)

            if not participant:
                return {'success': False, 'error': 'Partner does not match filter criteria'}

            return {
                'success': True,
                'participant': {
                    'id': participant.id,
                    'state': participant.state,
                },
            }

        except Exception as e:
            return {'success': False, 'error': str(e)}

    @http.route('/api/ecommerce/marketing/automations/<int:automation_id>/delete', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def delete_automation(self, automation_id, **kwargs):
        """Supprime un workflow."""
        try:
            automation = request.env['quelyos.marketing.automation'].sudo().browse(automation_id)
            if not automation.exists():
                return {'success': False, 'error': 'Automation not found'}

            automation.unlink()

            return {'success': True}

        except Exception as e:
            return {'success': False, 'error': str(e)}

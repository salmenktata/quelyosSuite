# -*- coding: utf-8 -*-
import logging
import json
from datetime import datetime, timedelta
from odoo import http
from odoo.http import request
from .super_admin import SuperAdminController
from ..config import get_cors_headers

_logger = logging.getLogger(__name__)


class AdminBackupController(SuperAdminController):
    """Contrôleur super-admin pour les sauvegardes"""

    @http.route('/api/super-admin/backups', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def list_backups(self):
        """Liste tous les backups"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers,
                status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers,
                status=403
            )

        try:
            Backup = request.env['quelyos.backup'].sudo()

            # Filtrage par tenant (optionnel)
            tenant_id = request.params.get('tenant_id')
            domain = []

            if tenant_id:
                try:
                    domain.append(('tenant_id', '=', int(tenant_id)))
                except (ValueError, TypeError):
                    return request.make_json_response(
                        {'success': False, 'error': 'tenant_id invalide'},
                        headers=cors_headers,
                        status=400
                    )

            backups = Backup.search(domain, order='create_date desc', limit=100)

            # Récupérer paramètres backup auto
            ICP = request.env['ir.config_parameter'].sudo()
            last_auto = ICP.get_param('quelyos.backup.last_auto', False)
            next_scheduled = ICP.get_param('quelyos.backup.next_scheduled', False)

            # Récupérer schedule
            schedule = {
                'enabled': ICP.get_param('quelyos.backup.schedule.enabled', 'false') == 'true',
                'frequency': ICP.get_param('quelyos.backup.schedule.frequency', 'daily'),
                'day_of_week': int(ICP.get_param('quelyos.backup.schedule.day_of_week', '1')),
                'day_of_month': int(ICP.get_param('quelyos.backup.schedule.day_of_month', '1')),
                'hour': int(ICP.get_param('quelyos.backup.schedule.hour', '2')),
                'minute': int(ICP.get_param('quelyos.backup.schedule.minute', '0')),
                'backup_type': ICP.get_param('quelyos.backup.schedule.type', 'full'),
                'retention_count': int(ICP.get_param('quelyos.backup.schedule.retention', '7')),
            }

            data = {
                'success': True,
                'data': [self._serialize_backup(b) for b in backups],
                'total': len(backups),
                'last_auto_backup': last_auto,
                'next_scheduled_backup': next_scheduled,
                'schedule': schedule,
            }
            return request.make_json_response(data, headers=cors_headers)

        except Exception as e:
            _logger.error(f"List backups error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )

    @http.route('/api/super-admin/backups/schedule', type='http', auth='public', methods=['GET', 'POST', 'OPTIONS'], csrf=False)
    def backup_schedule(self):
        """GET/POST schedule de backup automatique"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers,
                status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers,
                status=403
            )

        try:
            ICP = request.env['ir.config_parameter'].sudo()

            if request.httprequest.method == 'GET':
                schedule = {
                    'enabled': ICP.get_param('quelyos.backup.schedule.enabled', 'false') == 'true',
                    'frequency': ICP.get_param('quelyos.backup.schedule.frequency', 'daily'),
                    'day_of_week': int(ICP.get_param('quelyos.backup.schedule.day_of_week', '1')),
                    'day_of_month': int(ICP.get_param('quelyos.backup.schedule.day_of_month', '1')),
                    'hour': int(ICP.get_param('quelyos.backup.schedule.hour', '2')),
                    'minute': int(ICP.get_param('quelyos.backup.schedule.minute', '0')),
                    'backup_type': ICP.get_param('quelyos.backup.schedule.type', 'full'),
                    'retention_count': int(ICP.get_param('quelyos.backup.schedule.retention', '7')),
                }
                return request.make_json_response({'success': True, 'schedule': schedule}, headers=cors_headers)

            # POST - Save schedule
            data = json.loads(request.httprequest.data.decode('utf-8')) if request.httprequest.data else {}

            ICP.set_param('quelyos.backup.schedule.enabled', 'true' if data.get('enabled') else 'false')
            ICP.set_param('quelyos.backup.schedule.frequency', data.get('frequency', 'daily'))
            ICP.set_param('quelyos.backup.schedule.day_of_week', str(data.get('day_of_week', 1)))
            ICP.set_param('quelyos.backup.schedule.day_of_month', str(data.get('day_of_month', 1)))
            ICP.set_param('quelyos.backup.schedule.hour', str(data.get('hour', 2)))
            ICP.set_param('quelyos.backup.schedule.minute', str(data.get('minute', 0)))
            ICP.set_param('quelyos.backup.schedule.type', data.get('backup_type', 'full'))
            ICP.set_param('quelyos.backup.schedule.retention', str(data.get('retention_count', 7)))

            _logger.info(
                f"[AUDIT] Backup schedule updated - User: {request.env.user.login} | "
                f"Enabled: {data.get('enabled')} | Frequency: {data.get('frequency')}"
            )

            return request.make_json_response({
                'success': True,
                'message': 'Schedule sauvegardé'
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Backup schedule error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )

    @http.route('/api/super-admin/backups/trigger', type='http', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def trigger_backup(self):
        """Déclenche un backup manuel"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers,
                status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers,
                status=403
            )

        try:
            data = json.loads(request.httprequest.data.decode('utf-8')) if request.httprequest.data else {}
            backup_type = data.get('type', 'full')
            tenant_id = data.get('tenant_id')

            Backup = request.env['quelyos.backup'].sudo()

            # Vérifier si tenant backup
            if tenant_id:
                Tenant = request.env['quelyos.tenant'].sudo()
                tenant = Tenant.browse(tenant_id)
                if not tenant.exists():
                    return request.make_json_response(
                        {'success': False, 'error': 'Tenant non trouvé'},
                        headers=cors_headers,
                        status=404
                    )

                backup = Backup.create({
                    'type': 'tenant',
                    'tenant_id': tenant_id,
                    'status': 'pending',
                    'triggered_by': request.env.user.id,
                })

                _logger.info(
                    f"[AUDIT] Tenant backup triggered - User: {request.env.user.login} | "
                    f"Tenant: {tenant.code} | Backup ID: {backup.id}"
                )
            else:
                # Backup global (comportement actuel)
                backup = Backup.create({
                    'type': backup_type,
                    'status': 'pending',
                    'triggered_by': request.env.user.id,
                })

                _logger.info(
                    f"[AUDIT] Backup triggered - User: {request.env.user.login} | "
                    f"Type: {backup_type} | Backup ID: {backup.id}"
                )

            backup_id = backup.id
            db_name = request.env.cr.dbname

            # IMPORTANT: Commit pour que le thread voit le record
            request.env.cr.commit()

            # Lancer le backup en tâche de fond (via threading avec nouveau cursor)
            def _execute_backup_thread():
                try:
                    import odoo
                    from odoo.api import Environment
                    from odoo.modules.registry import Registry
                    registry = Registry(db_name)
                    with registry.cursor() as cr:
                        env = Environment(cr, odoo.SUPERUSER_ID, {})
                        backup_record = env['quelyos.backup'].browse(backup_id)

                        # Exécuter méthode appropriée
                        if backup_record.type == 'tenant':
                            backup_record.execute_tenant_backup()
                        else:
                            backup_record.execute_backup()

                        cr.commit()
                except Exception as e:
                    _logger.error(f"Background backup thread error: {e}", exc_info=True)

            import threading
            thread = threading.Thread(target=_execute_backup_thread)
            thread.daemon = True
            thread.start()

            return request.make_json_response({
                'success': True,
                'backup_id': backup_id,
                'message': 'Backup déclenché avec succès'
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Trigger backup error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )

    @http.route('/api/super-admin/backups/<int:backup_id>/restore', type='http', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def restore_backup(self, backup_id):
        """Restaure un backup"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers,
                status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers,
                status=403
            )

        try:
            Backup = request.env['quelyos.backup'].sudo()
            backup = Backup.browse(backup_id)

            if not backup.exists():
                return request.make_json_response(
                    {'success': False, 'error': 'Backup non trouvé'},
                    headers=cors_headers,
                    status=404
                )

            if backup.status != 'completed':
                return request.make_json_response(
                    {'success': False, 'error': 'Backup non disponible pour restauration'},
                    headers=cors_headers,
                    status=400
                )

            db_name = request.env.cr.dbname
            filename = backup.filename

            _logger.warning(
                f"[AUDIT] Backup RESTORE initiated - User: {request.env.user.login} | "
                f"Backup ID: {backup_id} | Filename: {filename}"
            )

            # Lancer la restauration en tâche de fond (via threading avec nouveau cursor)
            def _execute_restore_thread():
                try:
                    import odoo
                    from odoo.api import Environment
                    from odoo.modules.registry import Registry
                    registry = Registry(db_name)
                    with registry.cursor() as cr:
                        env = Environment(cr, odoo.SUPERUSER_ID, {})
                        backup_record = env['quelyos.backup'].browse(backup_id)

                        # Exécuter méthode appropriée
                        if backup_record.type == 'tenant':
                            backup_record.execute_tenant_restore()
                        else:
                            backup_record.execute_restore()

                        cr.commit()
                except Exception as e:
                    _logger.error(f"Background restore thread error: {e}", exc_info=True)

            import threading
            thread = threading.Thread(target=_execute_restore_thread)
            thread.daemon = True
            thread.start()

            return request.make_json_response({
                'success': True,
                'message': 'Restauration lancée'
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Restore backup error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )

    @http.route('/api/super-admin/backups/<int:backup_id>/download', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def download_backup(self, backup_id):
        """Télécharge un backup"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers,
                status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers,
                status=403
            )

        try:
            Backup = request.env['quelyos.backup'].sudo()
            backup = Backup.browse(backup_id)

            if not backup.exists():
                return request.make_json_response(
                    {'success': False, 'error': 'Backup non trouvé'},
                    headers=cors_headers,
                    status=404
                )

            if backup.status != 'completed' or not backup.file_path:
                return request.make_json_response(
                    {'success': False, 'error': 'Backup non disponible pour téléchargement'},
                    headers=cors_headers,
                    status=400
                )

            import os
            if not os.path.exists(backup.file_path):
                return request.make_json_response(
                    {'success': False, 'error': 'Fichier de backup introuvable'},
                    headers=cors_headers,
                    status=404
                )

            _logger.info(
                f"[AUDIT] Backup DOWNLOAD - User: {request.env.user.login} | "
                f"Backup ID: {backup_id} | Filename: {backup.filename}"
            )

            # Lire le fichier et retourner en téléchargement
            with open(backup.file_path, 'rb') as f:
                file_content = f.read()

            headers = [
                ('Content-Type', 'application/octet-stream'),
                ('Content-Disposition', f'attachment; filename="{backup.filename}"'),
                ('Content-Length', str(len(file_content))),
            ]
            headers.extend(cors_headers.items())

            response = request.make_response(file_content, headers=headers)
            return response

        except Exception as e:
            _logger.error(f"Download backup error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )

    @http.route('/api/super-admin/backups/<int:backup_id>', type='http', auth='public', methods=['DELETE', 'OPTIONS'], csrf=False)
    def delete_backup(self, backup_id):
        """Supprime un backup"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers,
                status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers,
                status=403
            )

        try:
            Backup = request.env['quelyos.backup'].sudo()
            backup = Backup.browse(backup_id)

            if not backup.exists():
                return request.make_json_response(
                    {'success': False, 'error': 'Backup non trouvé'},
                    headers=cors_headers,
                    status=404
                )

            filename = backup.filename
            file_path = backup.file_path

            _logger.warning(
                f"[AUDIT] Backup DELETE - User: {request.env.user.login} | "
                f"Backup ID: {backup_id} | Filename: {filename} | Status: {backup.status}"
            )

            # Supprimer le fichier physique si existe
            import os
            if file_path and os.path.exists(file_path):
                try:
                    os.remove(file_path)
                    _logger.info(f"Backup file deleted: {file_path}")
                except Exception as e:
                    _logger.warning(f"Could not delete backup file: {e}")

            # Supprimer l'enregistrement DB
            backup.unlink()

            return request.make_json_response({
                'success': True,
                'message': 'Backup supprimé'
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Delete backup error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )

    def _serialize_backup(self, backup):
        """Sérialise un backup pour l'API"""
        return {
            'id': backup.id,
            'filename': backup.filename,
            'type': backup.type,
            'tenant_id': backup.tenant_id.id if backup.tenant_id else None,
            'tenant_name': backup.tenant_id.name if backup.tenant_id else None,
            'size_mb': backup.size_mb,
            'status': backup.status,
            'created_at': backup.create_date.isoformat() if backup.create_date else None,
            'completed_at': backup.completed_at.isoformat() if backup.completed_at else None,
            'download_url': f'/api/super-admin/backups/{backup.id}/download' if backup.status == 'completed' else None,
            'error_message': backup.error_message,
            'records_count': backup.records_count if backup.type == 'tenant' else 0,
            'data_models': backup.data_models,
        }

    @http.route('/api/super-admin/backup-schedules', type='http', auth='public', methods=['GET', 'POST', 'OPTIONS'], csrf=False)
    def backup_schedules(self):
        """GET: Liste schedules | POST: Créer schedule"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers,
                status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers,
                status=403
            )

        try:
            Schedule = request.env['quelyos.backup.schedule'].sudo()

            if request.httprequest.method == 'GET':
                # Liste schedules
                schedules = Schedule.search([], order='tenant_id, create_date desc')

                data = {
                    'success': True,
                    'data': [self._serialize_schedule(s) for s in schedules],
                    'total': len(schedules),
                }
                return request.make_json_response(data, headers=cors_headers)

            elif request.httprequest.method == 'POST':
                # Créer schedule
                data = json.loads(request.httprequest.data.decode('utf-8')) if request.httprequest.data else {}

                schedule = Schedule.create({
                    'tenant_id': data.get('tenant_id'),
                    'enabled': data.get('enabled', True),
                    'frequency': data.get('frequency', 'daily'),
                    'day_of_week': data.get('day_of_week'),
                    'day_of_month': data.get('day_of_month'),
                    'hour': data.get('hour', 2),
                    'minute': data.get('minute', 0),
                    'backup_type': 'tenant',
                    'retention_count': data.get('retention_count', 7),
                    'notification_email': data.get('notification_email'),
                })

                _logger.info(
                    f"[AUDIT] Backup schedule created - User: {request.env.user.login} | "
                    f"Tenant: {schedule.tenant_id.code} | Schedule ID: {schedule.id}"
                )

                return request.make_json_response({
                    'success': True,
                    'data': self._serialize_schedule(schedule),
                }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Backup schedules error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )

    @http.route('/api/super-admin/backup-schedules/<int:schedule_id>', type='http', auth='public', methods=['GET', 'PUT', 'DELETE', 'OPTIONS'], csrf=False)
    def backup_schedule_detail(self, schedule_id):
        """GET: Détails | PUT: Modifier | DELETE: Supprimer"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers,
                status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers,
                status=403
            )

        try:
            Schedule = request.env['quelyos.backup.schedule'].sudo()
            schedule = Schedule.browse(schedule_id)

            if not schedule.exists():
                return request.make_json_response(
                    {'success': False, 'error': 'Schedule non trouvé'},
                    headers=cors_headers,
                    status=404
                )

            if request.httprequest.method == 'GET':
                return request.make_json_response({
                    'success': True,
                    'data': self._serialize_schedule(schedule),
                }, headers=cors_headers)

            elif request.httprequest.method == 'PUT':
                data = json.loads(request.httprequest.data.decode('utf-8')) if request.httprequest.data else {}

                update_vals = {}
                if 'enabled' in data:
                    update_vals['enabled'] = data['enabled']
                if 'frequency' in data:
                    update_vals['frequency'] = data['frequency']
                if 'day_of_week' in data:
                    update_vals['day_of_week'] = data['day_of_week']
                if 'day_of_month' in data:
                    update_vals['day_of_month'] = data['day_of_month']
                if 'hour' in data:
                    update_vals['hour'] = data['hour']
                if 'minute' in data:
                    update_vals['minute'] = data['minute']
                if 'retention_count' in data:
                    update_vals['retention_count'] = data['retention_count']
                if 'notification_email' in data:
                    update_vals['notification_email'] = data['notification_email']

                schedule.write(update_vals)

                _logger.info(
                    f"[AUDIT] Backup schedule updated - User: {request.env.user.login} | "
                    f"Schedule ID: {schedule_id}"
                )

                return request.make_json_response({
                    'success': True,
                    'data': self._serialize_schedule(schedule),
                }, headers=cors_headers)

            elif request.httprequest.method == 'DELETE':
                tenant_code = schedule.tenant_id.code

                schedule.unlink()

                _logger.info(
                    f"[AUDIT] Backup schedule deleted - User: {request.env.user.login} | "
                    f"Schedule ID: {schedule_id} | Tenant: {tenant_code}"
                )

                return request.make_json_response({
                    'success': True,
                    'message': 'Schedule supprimé',
                }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Backup schedule detail error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )

    @http.route('/api/super-admin/backup-schedules/<int:schedule_id>/run-now', type='http', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def backup_schedule_run_now(self, schedule_id):
        """Force l'exécution immédiate d'un schedule"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers,
                status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers,
                status=403
            )

        try:
            Schedule = request.env['quelyos.backup.schedule'].sudo()
            schedule = Schedule.browse(schedule_id)

            if not schedule.exists():
                return request.make_json_response(
                    {'success': False, 'error': 'Schedule non trouvé'},
                    headers=cors_headers,
                    status=404
                )

            _logger.info(
                f"[AUDIT] Backup schedule force run - User: {request.env.user.login} | "
                f"Schedule ID: {schedule_id} | Tenant: {schedule.tenant_id.code}"
            )

            # Exécuter immédiatement
            schedule.execute_scheduled_backup()

            return request.make_json_response({
                'success': True,
                'message': 'Backup lancé',
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Backup schedule run now error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )

    def _serialize_schedule(self, schedule):
        """Sérialise un schedule pour l'API"""
        return {
            'id': schedule.id,
            'tenant_id': schedule.tenant_id.id,
            'tenant_name': schedule.tenant_id.name,
            'tenant_code': schedule.tenant_id.code,
            'enabled': schedule.enabled,
            'frequency': schedule.frequency,
            'day_of_week': schedule.day_of_week,
            'day_of_month': schedule.day_of_month,
            'hour': schedule.hour,
            'minute': schedule.minute,
            'backup_type': schedule.backup_type,
            'retention_count': schedule.retention_count,
            'last_run': schedule.last_run.isoformat() if schedule.last_run else None,
            'next_run': schedule.next_run.isoformat() if schedule.next_run else None,
            'last_backup_id': schedule.last_backup_id.id if schedule.last_backup_id else None,
            'last_status': schedule.last_status,
            'notification_email': schedule.notification_email,
        }

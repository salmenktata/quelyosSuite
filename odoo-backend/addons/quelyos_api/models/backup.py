# -*- coding: utf-8 -*-
"""
Modèle Backup pour la gestion des sauvegardes
"""

from odoo import models, fields, api
from datetime import datetime
import subprocess
import os
import logging

_logger = logging.getLogger(__name__)


class QuelyosBackup(models.Model):
    _name = 'quelyos.backup'
    _description = 'Database Backup'
    _order = 'create_date desc'

    filename = fields.Char(
        string='Filename',
        compute='_compute_filename',
        store=True,
    )
    type = fields.Selection([
        ('full', 'Full'),
        ('incremental', 'Incremental'),
        ('tenant', 'Tenant'),
    ], string='Type', required=True, default='full')

    tenant_id = fields.Many2one(
        'quelyos.tenant',
        string='Tenant',
        help='For tenant-specific backups',
    )

    size_mb = fields.Float(string='Size (MB)', default=0)
    status = fields.Selection([
        ('pending', 'Pending'),
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ], string='Status', default='pending', required=True)

    completed_at = fields.Datetime(string='Completed At')
    error_message = fields.Text(string='Error Message')
    file_path = fields.Char(string='File Path')

    triggered_by = fields.Many2one(
        'res.users',
        string='Triggered By',
        default=lambda self: self.env.user,
    )

    @api.depends('type', 'tenant_id', 'create_date')
    def _compute_filename(self):
        for record in self:
            date_str = record.create_date.strftime('%Y%m%d_%H%M%S') if record.create_date else datetime.now().strftime('%Y%m%d_%H%M%S')
            if record.tenant_id:
                record.filename = f"backup_{record.tenant_id.code}_{date_str}.dump"
            else:
                record.filename = f"backup_{record.type}_{date_str}.dump"

    def execute_backup(self):
        """Exécute le backup (appelé en tâche de fond)"""
        self.ensure_one()
        self.status = 'running'
        self.env.cr.commit()

        try:
            db_name = self.env.cr.dbname
            backup_dir = self.env['ir.config_parameter'].sudo().get_param(
                'quelyos.backup.directory',
                '/var/lib/odoo/backups'
            )

            # Créer le répertoire si nécessaire
            os.makedirs(backup_dir, exist_ok=True)

            file_path = os.path.join(backup_dir, self.filename)

            # Exécuter pg_dump
            cmd = [
                'pg_dump',
                '-Fc',  # Format custom (compressé)
                '-f', file_path,
                db_name,
            ]

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=3600,  # 1h max
            )

            if result.returncode != 0:
                raise Exception(f"pg_dump failed: {result.stderr}")

            # Récupérer la taille
            size_bytes = os.path.getsize(file_path)
            size_mb = size_bytes / (1024 * 1024)

            self.write({
                'status': 'completed',
                'completed_at': datetime.now(),
                'file_path': file_path,
                'size_mb': size_mb,
            })

            # Mettre à jour le paramètre last_auto_backup
            self.env['ir.config_parameter'].sudo().set_param(
                'quelyos.backup.last_auto',
                datetime.now().isoformat()
            )

            _logger.info(f"Backup completed: {self.filename} ({size_mb:.2f} MB)")

        except Exception as e:
            _logger.error(f"Backup failed: {e}")
            self.write({
                'status': 'failed',
                'error_message': str(e),
            })

    def execute_restore(self):
        """Restaure le backup (appelé en tâche de fond)"""
        self.ensure_one()

        if self.status != 'completed' or not self.file_path:
            raise Exception("Backup not available for restore")

        _logger.warning(f"Starting restore from {self.filename}")

        try:
            db_name = self.env.cr.dbname

            # Restaurer via pg_restore
            cmd = [
                'pg_restore',
                '-c',  # Clean (drop objects before creating)
                '-d', db_name,
                self.file_path,
            ]

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=7200,  # 2h max
            )

            if result.returncode != 0:
                _logger.warning(f"pg_restore warnings: {result.stderr}")

            _logger.info(f"Restore completed from {self.filename}")

        except Exception as e:
            _logger.error(f"Restore failed: {e}")
            raise

# -*- coding: utf-8 -*-
"""
Modèle Backup pour la gestion des sauvegardes
"""

from odoo import models, fields, api
from odoo.exceptions import ValidationError
from datetime import datetime
import subprocess
import os
import logging
import json
import zipfile
import shutil
import base64

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

    data_models = fields.Text(
        string='Models Exported',
        help='JSON list of exported models for tenant backups'
    )
    records_count = fields.Integer(
        string='Records Count',
        default=0,
        help='Total records exported in tenant backup'
    )

    @api.depends('type', 'tenant_id', 'create_date')
    def _compute_filename(self):
        for record in self:
            date_str = record.create_date.strftime('%Y%m%d_%H%M%S') if record.create_date else datetime.now().strftime('%Y%m%d_%H%M%S')
            if record.tenant_id:
                # Tenant backup = ZIP (JSON + filestore)
                extension = 'zip' if record.type == 'tenant' else 'dump'
                record.filename = f"backup_{record.tenant_id.code}_{date_str}.{extension}"
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

            # Récupérer les paramètres de connexion PostgreSQL depuis la config Odoo
            db_host = self.env.cr._cnx.info.host or 'db'
            db_port = self.env.cr._cnx.info.port or 5432
            db_user = self.env.cr._cnx.info.user or 'odoo'

            # Exécuter pg_dump avec paramètres de connexion réseau
            cmd = [
                'pg_dump',
                '-Fc',  # Format custom (compressé)
                '-h', db_host,  # Host
                '-p', str(db_port),  # Port
                '-U', db_user,  # Username
                '-f', file_path,
                db_name,
            ]

            # Ajouter le mot de passe via variable d'environnement
            env = os.environ.copy()
            env['PGPASSWORD'] = self.env.cr._cnx.info.password or 'odoo'

            result = subprocess.run(
                cmd,
                env=env,
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

            # Récupérer les paramètres de connexion PostgreSQL
            db_host = self.env.cr._cnx.info.host or 'db'
            db_port = self.env.cr._cnx.info.port or 5432
            db_user = self.env.cr._cnx.info.user or 'odoo'
            db_password = self.env.cr._cnx.info.password or 'odoo'

            env_vars = os.environ.copy()
            env_vars['PGPASSWORD'] = db_password

            _logger.warning(f"Terminating all connections to database {db_name}")

            # Forcer la déconnexion de toutes les sessions actives (sauf la nôtre)
            terminate_cmd = [
                'psql',
                '-h', db_host,
                '-p', str(db_port),
                '-U', db_user,
                '-d', 'postgres',
                '-c', f"SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '{db_name}' AND pid <> pg_backend_pid();"
            ]

            subprocess.run(
                terminate_cmd,
                env=env_vars,
                capture_output=True,
                text=True,
                timeout=30
            )

            _logger.warning("All connections terminated, starting restore")

            # Restaurer via pg_restore avec paramètres de connexion réseau
            cmd = [
                'pg_restore',
                '-c',  # Clean (drop objects before creating)
                '--if-exists',  # Ne pas échouer si l'objet n'existe pas
                '-h', db_host,
                '-p', str(db_port),
                '-U', db_user,
                '-d', db_name,
                self.file_path,
            ]

            # Ajouter le mot de passe via variable d'environnement
            env = env_vars

            result = subprocess.run(
                cmd,
                env=env,
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

    # =========================================================================
    # TENANT BACKUP/RESTORE METHODS
    # =========================================================================

    def execute_tenant_backup(self):
        """Exécute backup tenant (export JSON + filestore)"""
        self.ensure_one()

        if not self.tenant_id:
            raise ValidationError("Tenant requis pour backup tenant")

        self.status = 'running'
        self.env.cr.commit()

        try:
            tenant = self.tenant_id
            company = tenant.company_id

            _logger.info(f"Starting tenant backup: {tenant.code}")

            # Répertoire backup tenant
            backup_dir = self.env['ir.config_parameter'].sudo().get_param(
                'quelyos.backup.directory',
                '/var/lib/odoo/backups'
            )
            tenant_backup_dir = os.path.join(backup_dir, 'tenants')
            os.makedirs(tenant_backup_dir, exist_ok=True)

            # Répertoire temporaire pour construction backup
            temp_dir = os.path.join(tenant_backup_dir, f'temp_{tenant.code}_{datetime.now().strftime("%Y%m%d_%H%M%S")}')
            os.makedirs(temp_dir, exist_ok=True)

            try:
                # 1. Export données (JSON)
                exported_data, total_records = self._export_tenant_data(company, temp_dir)

                # 2. Export filestore
                self._export_filestore(company, temp_dir)

                # 3. Créer metadata
                metadata = {
                    'tenant_code': tenant.code,
                    'tenant_name': tenant.name,
                    'company_id': company.id,
                    'export_date': fields.Datetime.now().isoformat(),
                    'records_count': total_records,
                    'models': list(exported_data.keys()),
                    'version': '1.0',
                }

                with open(os.path.join(temp_dir, 'metadata.json'), 'w', encoding='utf-8') as f:
                    json.dump(metadata, f, indent=2, ensure_ascii=False)

                # 4. Créer ZIP
                zip_path = os.path.join(tenant_backup_dir, self.filename)
                self._create_backup_zip(temp_dir, zip_path)

                # 5. MAJ backup record
                size_mb = os.path.getsize(zip_path) / (1024 * 1024)
                self.write({
                    'status': 'completed',
                    'completed_at': fields.Datetime.now(),
                    'file_path': zip_path,
                    'size_mb': size_mb,
                    'data_models': json.dumps(list(exported_data.keys())),
                    'records_count': total_records,
                })

                _logger.info(
                    f"Tenant backup completed: {tenant.code} | "
                    f"{total_records} records | {size_mb:.2f} MB"
                )

            finally:
                # Nettoyer temp dir
                if os.path.exists(temp_dir):
                    shutil.rmtree(temp_dir)

        except Exception as e:
            _logger.error(f"Tenant backup failed: {e}", exc_info=True)
            self.write({
                'status': 'failed',
                'error_message': str(e),
            })

    def _export_tenant_data(self, company, temp_dir):
        """Export données tenant en JSON"""
        # Modèles critiques à exporter (ordre important)
        models_to_export = [
            'res.partner',
            'product.category',
            'product.template',
            'product.product',
            'product.pricelist',
            'product.pricelist.item',
            'account.tax',
            'sale.order',
            'sale.order.line',
            'account.move',
            'account.move.line',
            'stock.location',
            'stock.warehouse',
            'stock.quant',
            'stock.picking',
            'stock.move',
            'crm.lead',
            'crm.stage',
        ]

        exported_data = {}
        total_records = 0

        for model_name in models_to_export:
            try:
                if model_name not in self.env:
                    _logger.warning(f"Model {model_name} not found, skipping")
                    continue

                Model = self.env[model_name].sudo()

                # Filtrer par company_id
                domain = [('company_id', '=', company.id)]
                records = Model.search(domain)

                if not records:
                    continue

                model_data = []
                for record in records:
                    record_data = self._export_record_json(record)
                    if record_data:
                        model_data.append(record_data)
                        total_records += 1

                if model_data:
                    exported_data[model_name] = model_data
                    _logger.info(f"Exported {len(model_data)} records from {model_name}")

            except Exception as e:
                _logger.error(f"Error exporting {model_name}: {e}")
                continue

        # Sauvegarder data.json
        data_path = os.path.join(temp_dir, 'data.json')
        with open(data_path, 'w', encoding='utf-8') as f:
            json.dump(exported_data, f, indent=2, ensure_ascii=False, default=str)

        return exported_data, total_records

    def _export_record_json(self, record):
        """Export un record Odoo en dict JSON"""
        try:
            data = {}

            for field_name, field in record._fields.items():
                # Ignorer champs techniques
                if field_name in ['__last_update', 'display_name', 'create_uid', 'write_uid', 'message_ids', 'activity_ids']:
                    continue

                # Ignorer champs compute sans store
                if field.compute and not field.store:
                    continue

                value = record[field_name]

                # Gérer types spéciaux
                if field.type == 'many2one':
                    data[field_name] = value.id if value else False
                elif field.type in ['one2many', 'many2many']:
                    data[field_name] = value.ids if value else []
                elif field.type == 'binary':
                    # Stocker binary en base64 (limité pour éviter gros JSON)
                    if value and len(value) < 1024 * 1024:  # Max 1MB
                        data[field_name] = base64.b64encode(value).decode('utf-8')
                    else:
                        data[field_name] = False
                elif field.type == 'datetime':
                    data[field_name] = value.isoformat() if value else False
                elif field.type == 'date':
                    data[field_name] = value.isoformat() if value else False
                else:
                    data[field_name] = value

            return data

        except Exception as e:
            _logger.error(f"Error exporting record {record}: {e}")
            return None

    def _export_filestore(self, company, temp_dir):
        """Export filestore tenant (images, PDF, etc.)"""
        try:
            filestore_dir = os.path.join(temp_dir, 'filestore')
            os.makedirs(filestore_dir, exist_ok=True)

            # Récupérer attachments liés au tenant
            Attachment = self.env['ir.attachment'].sudo()
            attachments = Attachment.search([
                '|',
                ('company_id', '=', company.id),
                ('res_model', 'in', ['product.template', 'product.product', 'res.partner'])
            ])

            exported_count = 0
            for attachment in attachments:
                try:
                    if not attachment.datas:
                        continue

                    # Créer sous-dossier par type
                    subdir = os.path.join(filestore_dir, attachment.res_model or 'misc')
                    os.makedirs(subdir, exist_ok=True)

                    # Sauvegarder fichier
                    filename = f"{attachment.id}_{attachment.name}" if attachment.name else str(attachment.id)
                    filepath = os.path.join(subdir, filename)

                    with open(filepath, 'wb') as f:
                        f.write(base64.b64decode(attachment.datas))

                    exported_count += 1

                except Exception as e:
                    _logger.error(f"Error exporting attachment {attachment.id}: {e}")
                    continue

            _logger.info(f"Exported {exported_count} attachments to filestore")

        except Exception as e:
            _logger.error(f"Error exporting filestore: {e}")

    def _create_backup_zip(self, source_dir, zip_path):
        """Crée ZIP final du backup"""
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, _dirs, files in os.walk(source_dir):
                for file in files:
                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, source_dir)
                    zipf.write(file_path, arcname)

        _logger.info(f"Backup ZIP created: {zip_path}")

    def execute_tenant_restore(self):
        """Restaure backup tenant"""
        self.ensure_one()

        if not self.tenant_id:
            raise ValidationError("Backup tenant requis pour restauration")

        if self.status != 'completed' or not self.file_path:
            raise ValidationError("Backup non disponible pour restauration")

        _logger.warning(f"Starting tenant restore: {self.tenant_id.code} from {self.filename}")

        try:
            tenant = self.tenant_id
            company = tenant.company_id

            # Extraire ZIP
            temp_dir = os.path.join(
                os.path.dirname(self.file_path),
                f'restore_{tenant.code}_{datetime.now().strftime("%Y%m%d_%H%M%S")}'
            )
            os.makedirs(temp_dir, exist_ok=True)

            try:
                with zipfile.ZipFile(self.file_path, 'r') as zipf:
                    zipf.extractall(temp_dir)

                # Lire metadata
                metadata_path = os.path.join(temp_dir, 'metadata.json')
                if not os.path.exists(metadata_path):
                    raise ValidationError("Metadata manquantes dans backup")

                with open(metadata_path, 'r', encoding='utf-8') as f:
                    metadata = json.load(f)

                # Vérifier compatibilité
                if metadata['tenant_code'] != tenant.code:
                    _logger.warning(
                        f"Tenant mismatch: backup={metadata['tenant_code']} "
                        f"target={tenant.code} - Proceeding anyway"
                    )

                # Lire data.json
                data_path = os.path.join(temp_dir, 'data.json')
                if not os.path.exists(data_path):
                    raise ValidationError("data.json manquant dans backup")

                with open(data_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)

                # Restaurer données (ordre critique)
                self._restore_tenant_data(data, company)

                # Restaurer filestore
                filestore_dir = os.path.join(temp_dir, 'filestore')
                if os.path.exists(filestore_dir):
                    self._restore_filestore(filestore_dir, company)

                _logger.info(f"Tenant restore completed: {tenant.code}")

            finally:
                # Nettoyer temp dir
                if os.path.exists(temp_dir):
                    shutil.rmtree(temp_dir)

        except Exception as e:
            _logger.error(f"Tenant restore failed: {e}", exc_info=True)
            raise

    def _restore_tenant_data(self, data, company):
        """Restaure données tenant (mode UPSERT)"""
        # Ordre restauration (respecter dépendances)
        models_order = [
            'res.partner',
            'product.category',
            'product.template',
            'product.product',
            'product.pricelist',
            'product.pricelist.item',
            'account.tax',
            'sale.order',
            'sale.order.line',
            'account.move',
            'account.move.line',
            'stock.location',
            'stock.warehouse',
            'stock.quant',
            'stock.picking',
            'stock.move',
            'crm.lead',
            'crm.stage',
        ]

        for model_name in models_order:
            if model_name not in data:
                continue

            try:
                if model_name not in self.env:
                    _logger.warning(f"Model {model_name} not found, skipping")
                    continue

                Model = self.env[model_name].sudo()
                records_data = data[model_name]

                restored_count = 0
                for record_data in records_data:
                    try:
                        # Mode UPSERT : chercher existing
                        record_id = record_data.get('id')
                        existing = Model.search([
                            ('id', '=', record_id),
                            ('company_id', '=', company.id)
                        ], limit=1)

                        # Forcer company_id
                        record_data['company_id'] = company.id

                        if existing:
                            # Update
                            existing.write(record_data)
                        else:
                            # Create
                            Model.create(record_data)

                        restored_count += 1

                    except Exception as e:
                        _logger.error(f"Error restoring record in {model_name}: {e}")
                        continue

                _logger.info(f"Restored {restored_count}/{len(records_data)} records in {model_name}")

            except Exception as e:
                _logger.error(f"Error restoring model {model_name}: {e}")
                continue

    def _restore_filestore(self, filestore_dir, company):
        """Restaure filestore tenant"""
        try:
            Attachment = self.env['ir.attachment'].sudo()
            restored_count = 0

            for root, _dirs, files in os.walk(filestore_dir):
                for filename in files:
                    try:
                        filepath = os.path.join(root, filename)

                        # Lire fichier
                        with open(filepath, 'rb') as f:
                            file_data = f.read()

                        # Extraire res_model du chemin
                        rel_path = os.path.relpath(root, filestore_dir)
                        res_model = rel_path if rel_path != '.' else 'misc'

                        # Créer/Update attachment
                        Attachment.create({
                            'name': filename,
                            'datas': base64.b64encode(file_data),
                            'res_model': res_model if res_model != 'misc' else False,
                            'company_id': company.id,
                        })

                        restored_count += 1

                    except Exception as e:
                        _logger.error(f"Error restoring attachment {filename}: {e}")
                        continue

            _logger.info(f"Restored {restored_count} attachments")

        except Exception as e:
            _logger.error(f"Error restoring filestore: {e}")

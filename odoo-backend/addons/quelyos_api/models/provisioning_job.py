# -*- coding: utf-8 -*-
"""
Modèle de Job pour le provisioning asynchrone des tenants.

Permet de suivre la progression du provisioning et de gérer les erreurs.
Utilise un worker thread pour exécuter les tâches en background.
"""

import logging
import threading
import traceback
from datetime import datetime

from odoo import models, fields, api, _
from odoo.exceptions import ValidationError

_logger = logging.getLogger(__name__)


class ProvisioningJob(models.Model):
    _name = 'quelyos.provisioning.job'
    _description = 'Job de provisioning tenant'
    _order = 'create_date desc'

    name = fields.Char(
        string='Référence',
        required=True,
        copy=False,
        readonly=True,
        default=lambda self: _('New')
    )

    tenant_id = fields.Many2one(
        'quelyos.tenant',
        string='Tenant',
        ondelete='cascade',
        required=True
    )

    state = fields.Selection([
        ('pending', 'En attente'),
        ('running', 'En cours'),
        ('completed', 'Terminé'),
        ('failed', 'Échoué'),
    ], string='État', default='pending', required=True)

    progress = fields.Integer(
        string='Progression (%)',
        default=0
    )

    current_step = fields.Char(
        string='Étape en cours',
        default='Initialisation...'
    )

    total_steps = fields.Integer(
        string='Nombre total d\'étapes',
        default=12
    )

    completed_steps = fields.Integer(
        string='Étapes terminées',
        default=0
    )

    error_message = fields.Text(
        string='Message d\'erreur'
    )

    started_at = fields.Datetime(
        string='Démarré à'
    )

    completed_at = fields.Datetime(
        string='Terminé à'
    )

    # Résultats du provisioning
    admin_email = fields.Char(string='Email admin')
    temp_password = fields.Char(string='Mot de passe temporaire')
    store_url = fields.Char(string='URL boutique')
    admin_url = fields.Char(string='URL backoffice')

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if vals.get('name', _('New')) == _('New'):
                vals['name'] = self.env['ir.sequence'].next_by_code('provisioning.job') or _('New')
        return super().create(vals_list)

    def _update_progress(self, step_name, step_number):
        """Met à jour la progression du job"""
        self.ensure_one()
        progress = int((step_number / self.total_steps) * 100)
        self.write({
            'current_step': step_name,
            'completed_steps': step_number,
            'progress': progress,
        })
        # Commit pour que le frontend puisse voir la progression
        self.env.cr.commit()

    def action_start(self):
        """Démarre le job de provisioning en background"""
        self.ensure_one()

        if self.state != 'pending':
            raise ValidationError(_("Ce job a déjà été exécuté"))

        self.write({
            'state': 'running',
            'started_at': fields.Datetime.now(),
        })
        self.env.cr.commit()

        # Lancer le provisioning dans un thread séparé
        thread = threading.Thread(
            target=self._run_provisioning_thread,
            args=(self.id, self.env.cr.dbname, self.env.uid)
        )
        thread.daemon = True
        thread.start()

        return True

    def _run_provisioning_thread(self, job_id, dbname, uid):
        """Exécute le provisioning dans un thread séparé"""
        import odoo
        from odoo import api, SUPERUSER_ID

        try:
            # Créer un nouvel environnement pour le thread
            registry = odoo.registry(dbname)
            with registry.cursor() as cr:
                env = api.Environment(cr, SUPERUSER_ID, {})
                job = env['quelyos.provisioning.job'].browse(job_id)

                if job.exists():
                    job._execute_provisioning()

        except Exception as e:
            _logger.error(f"Provisioning thread error: {e}")

    def _execute_provisioning(self):
        """Exécute les étapes de provisioning"""
        self.ensure_one()
        tenant = self.tenant_id

        steps = [
            ('Création de la société...', self._step_create_company),
            ('Création de l\'abonnement...', self._step_create_subscription),
            ('Création de l\'utilisateur admin...', self._step_create_admin),
            ('Configuration des paiements...', self._step_create_payments),
            ('Création de l\'entrepôt...', self._step_create_warehouse),
            ('Configuration des prix...', self._step_create_pricelist),
            ('Création des séquences...', self._step_create_sequences),
            ('Configuration des taxes...', self._step_create_taxes),
            ('Configuration des livraisons...', self._step_create_delivery),
            ('Création des pages légales...', self._step_create_legal_pages),
            ('Création du menu...', self._step_create_menu),
            ('Finalisation...', self._step_finalize),
        ]

        try:
            for i, (step_name, step_func) in enumerate(steps, 1):
                self._update_progress(step_name, i - 1)

                try:
                    step_func(tenant)
                except Exception as e:
                    _logger.warning(f"Step {step_name} warning: {e}")
                    # Continue même si une étape échoue (best effort)

            # Succès
            self.write({
                'state': 'completed',
                'progress': 100,
                'current_step': 'Provisioning terminé !',
                'completed_steps': len(steps),
                'completed_at': fields.Datetime.now(),
                'store_url': f"https://{tenant.domain}",
                'admin_url': f"https://{tenant.backoffice_domain or 'admin.' + tenant.domain}",
            })

            # Passer le tenant en actif
            tenant.write({'status': 'active'})
            tenant.message_post(body=_("Provisioning terminé avec succès"))

            # Envoyer l'email de bienvenue
            self._send_welcome_email()

        except Exception as e:
            _logger.error(f"Provisioning failed: {e}\n{traceback.format_exc()}")
            self.write({
                'state': 'failed',
                'error_message': str(e),
                'completed_at': fields.Datetime.now(),
            })
            tenant.message_post(body=_("Provisioning échoué : %s") % str(e))

        self.env.cr.commit()

    # ═══════════════════════════════════════════════════════════════════════════
    # ÉTAPES DE PROVISIONING
    # ═══════════════════════════════════════════════════════════════════════════

    def _step_create_company(self, tenant):
        """Crée la company Odoo si nécessaire"""
        if not tenant.company_id or tenant.company_id.id == self.env.company.id:
            company = self.env['res.company'].sudo().create({
                'name': tenant.name,
            })
            tenant.write({'company_id': company.id})

    def _step_create_subscription(self, tenant):
        """Crée l'abonnement"""
        if tenant.plan_id and not tenant.subscription_id:
            partner = tenant.company_id.partner_id
            subscription = self.env['quelyos.subscription'].sudo().create({
                'partner_id': partner.id,
                'company_id': tenant.company_id.id,
                'plan_id': tenant.plan_id.id,
                'state': 'trial',
                'billing_cycle': 'monthly',
            })
            tenant.write({'subscription_id': subscription.id})

    def _step_create_admin(self, tenant):
        """Crée l'utilisateur admin"""
        if tenant.admin_email:
            # Vérifier si l'utilisateur existe déjà
            existing = self.env['res.users'].sudo().search([
                ('login', '=', tenant.admin_email)
            ], limit=1)

            if not existing:
                import secrets
                temp_password = secrets.token_urlsafe(12)

                partner = self.env['res.partner'].sudo().create({
                    'name': tenant.admin_email.split('@')[0].title(),
                    'email': tenant.admin_email,
                    'company_id': tenant.company_id.id,
                })

                user = self.env['res.users'].sudo().create({
                    'name': partner.name,
                    'login': tenant.admin_email,
                    'password': temp_password,
                    'partner_id': partner.id,
                    'company_id': tenant.company_id.id,
                    'company_ids': [(4, tenant.company_id.id)],
                })

                self.write({
                    'admin_email': tenant.admin_email,
                    'temp_password': temp_password,
                })

    def _step_create_payments(self, tenant):
        """Configure les providers de paiement"""
        tenant._create_payment_providers()

    def _step_create_warehouse(self, tenant):
        """Crée l'entrepôt"""
        tenant._create_default_warehouse()

    def _step_create_pricelist(self, tenant):
        """Configure la pricelist"""
        tenant._create_default_pricelist()

    def _step_create_sequences(self, tenant):
        """Crée les séquences"""
        tenant._create_default_sequences()

    def _step_create_taxes(self, tenant):
        """Configure les taxes"""
        tenant._create_default_taxes()

    def _step_create_delivery(self, tenant):
        """Configure les méthodes de livraison"""
        tenant._create_default_delivery_methods()

    def _step_create_legal_pages(self, tenant):
        """Crée les pages légales"""
        tenant._create_default_legal_pages()

    def _step_create_menu(self, tenant):
        """Crée le menu de navigation"""
        tenant._create_default_menu()

    def _step_finalize(self, tenant):
        """Finalisation"""
        # Rien de spécial, juste marquer comme terminé
        pass

    def _send_welcome_email(self):
        """Envoie l'email de bienvenue"""
        self.ensure_one()

        if not self.admin_email:
            return

        try:
            template = self.env.ref('quelyos_api.email_template_welcome', raise_if_not_found=False)
            if template:
                template.send_mail(self.id, force_send=True)
            else:
                # Fallback: envoyer un email simple
                self._send_simple_welcome_email()
        except Exception as e:
            _logger.warning(f"Failed to send welcome email: {e}")

    def _send_simple_welcome_email(self):
        """Envoie un email de bienvenue simple sans template"""
        self.ensure_one()

        mail_values = {
            'subject': f"Bienvenue sur Quelyos - Votre boutique {self.tenant_id.name} est prête !",
            'email_from': self.env.company.email or 'noreply@quelyos.com',
            'email_to': self.admin_email,
            'body_html': f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #6366f1;">Bienvenue sur Quelyos !</h1>

                    <p>Votre boutique <strong>{self.tenant_id.name}</strong> est maintenant prête.</p>

                    <h2>Vos accès</h2>
                    <ul>
                        <li><strong>Boutique :</strong> <a href="{self.store_url}">{self.store_url}</a></li>
                        <li><strong>Backoffice :</strong> <a href="{self.admin_url}">{self.admin_url}</a></li>
                    </ul>

                    <h2>Identifiants de connexion</h2>
                    <ul>
                        <li><strong>Email :</strong> {self.admin_email}</li>
                        <li><strong>Mot de passe temporaire :</strong> {self.temp_password}</li>
                    </ul>

                    <p style="color: #ef4444;"><strong>Important :</strong> Changez votre mot de passe lors de votre première connexion.</p>

                    <h2>Prochaines étapes</h2>
                    <ol>
                        <li>Connectez-vous au backoffice</li>
                        <li>Ajoutez vos premiers produits</li>
                        <li>Personnalisez votre thème</li>
                        <li>Configurez vos paiements</li>
                    </ol>

                    <p>Besoin d'aide ? <a href="https://quelyos.com/docs">Consultez notre documentation</a></p>

                    <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 20px 0;">
                    <p style="color: #737373; font-size: 12px;">
                        Cet email a été envoyé automatiquement par Quelyos.<br>
                        © {datetime.now().year} Quelyos - Tous droits réservés.
                    </p>
                </div>
            """,
        }

        self.env['mail.mail'].sudo().create(mail_values).send()

    def to_dict(self):
        """Convertit le job en dictionnaire pour l'API"""
        self.ensure_one()
        return {
            'id': self.id,
            'name': self.name,
            'state': self.state,
            'progress': self.progress,
            'current_step': self.current_step,
            'total_steps': self.total_steps,
            'completed_steps': self.completed_steps,
            'error_message': self.error_message,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'store_url': self.store_url,
            'admin_url': self.admin_url,
            'tenant_code': self.tenant_id.code,
        }

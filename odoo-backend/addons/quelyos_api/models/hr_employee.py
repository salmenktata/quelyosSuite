# -*- coding: utf-8 -*-
"""
Extension du modèle Employé RH natif Odoo.

Ajoute le support multi-tenant, champs Tunisie (CNSS, CIN) et méthodes API.
Hérite de hr.employee pour bénéficier de toutes les fonctionnalités natives
incluant l'intégration avec hr_payroll et hr_attendance.
"""

from odoo import models, fields, api, _
from odoo.exceptions import ValidationError
from odoo.tools.translate import _


class HREmployee(models.Model):
    _inherit = 'hr.employee'

    # ═══════════════════════════════════════════════════════════════════════════
    # MULTI-TENANT (Extension Quelyos)
    # ═══════════════════════════════════════════════════════════════════════════

    tenant_id = fields.Many2one(
        'quelyos.tenant',
        string='Tenant',
        ondelete='cascade',
        index=True,
        help="Tenant propriétaire"
    )

    # ═══════════════════════════════════════════════════════════════════════════
    # IDENTIFICATION QUELYOS
    # ═══════════════════════════════════════════════════════════════════════════

    x_employee_number = fields.Char(
        string='Matricule',
        required=True,
        copy=False,
        readonly=True,
        default='Nouveau',
        index=True,
        tracking=True,
        help="Matricule unique de l'employé"
    )
    x_first_name = fields.Char(
        string='Prénom',
        tracking=True
    )
    x_last_name = fields.Char(
        string='Nom de famille',
        tracking=True
    )

    # ═══════════════════════════════════════════════════════════════════════════
    # CHAMPS TUNISIE (Spécifique localisation)
    # ═══════════════════════════════════════════════════════════════════════════

    x_cnss_number = fields.Char(
        string='N° CNSS',
        tracking=True,
        help="Numéro de sécurité sociale CNSS"
    )
    x_cin_number = fields.Char(
        string='N° CIN',
        tracking=True,
        help="Numéro de Carte d'Identité Nationale"
    )

    # ═══════════════════════════════════════════════════════════════════════════
    # STATUT EMPLOYÉ (Extension)
    # ═══════════════════════════════════════════════════════════════════════════

    x_employee_state = fields.Selection([
        ('active', 'Actif'),
        ('suspended', 'Suspendu'),
        ('departed', 'Parti'),
    ], string='Statut employé', default='active', tracking=True, required=True)

    # ═══════════════════════════════════════════════════════════════════════════
    # CHAMPS BANCAIRES (Override pour Tunisie)
    # ═══════════════════════════════════════════════════════════════════════════

    x_bank_name = fields.Char(
        string='Banque',
        help="Nom de la banque"
    )
    x_bank_account_number = fields.Char(
        string='RIB',
        help="Relevé d'Identité Bancaire (20 chiffres en Tunisie)"
    )

    # ═══════════════════════════════════════════════════════════════════════════
    # ANCIENNETÉ (Computed)
    # ═══════════════════════════════════════════════════════════════════════════

    x_seniority = fields.Char(
        string='Ancienneté',
        compute='_compute_seniority',
        help="Ancienneté dans l'entreprise"
    )
    x_hire_date = fields.Date(
        string="Date d'embauche",
        tracking=True,
        help="Date de début dans l'entreprise"
    )

    # ═══════════════════════════════════════════════════════════════════════════
    # CONTRAINTES
    # ═══════════════════════════════════════════════════════════════════════════
    # ═══════════════════════════════════════════════════════════════════════════
    # COMPUTED FIELDS
    # ═══════════════════════════════════════════════════════════════════════════

    @api.depends('first_name', 'last_name')

    @api.constrains('employee_number', 'tenant_id')
    def _check_employee_number_tenant_uniq(self):
        """Contrainte: Le matricule doit être unique par tenant !"""
        for record in self:
            # Chercher un doublon
            duplicate = self.search([
                ('employee_number', '=', record.x_employee_number),
                ('tenant_id', '=', record.tenant_id),
                ('id', '!=', record.id)
            ], limit=1)

            if duplicate:
                raise ValidationError(_('Le matricule doit être unique par tenant !'))


    @api.constrains('work_email', 'tenant_id')
    def _check_work_email_tenant_uniq(self):
        """Contrainte: Cet email professionnel est déjà utilisé !"""
        for record in self:
            # Chercher un doublon
            duplicate = self.search([
                ('work_email', '=', record.work_email),
                ('tenant_id', '=', record.tenant_id),
                ('id', '!=', record.id)
            ], limit=1)

            if duplicate:
                raise ValidationError(_('Cet email professionnel est déjà utilisé !'))


    @api.constrains('cnss_number', 'tenant_id')
    def _check_cnss_tenant_uniq(self):
        """Contrainte: Ce numéro CNSS est déjà utilisé !"""
        for record in self:
            # Chercher un doublon
            duplicate = self.search([
                ('cnss_number', '=', record.x_cnss_number),
                ('tenant_id', '=', record.tenant_id),
                ('id', '!=', record.id)
            ], limit=1)

            if duplicate:
                raise ValidationError(_('Ce numéro CNSS est déjà utilisé !'))


    @api.constrains('cin_number', 'tenant_id')
    def _check_cin_tenant_uniq(self):
        """Contrainte: Ce numéro CIN est déjà utilisé !"""
        for record in self:
            # Chercher un doublon
            duplicate = self.search([
                ('cin_number', '=', record.x_cin_number),
                ('tenant_id', '=', record.tenant_id),
                ('id', '!=', record.id)
            ], limit=1)

            if duplicate:
                raise ValidationError(_('Ce numéro CIN est déjà utilisé !'))


    def _compute_name_from_parts(self):
        """Calcule le nom complet à partir du prénom et nom."""
        for employee in self:
            if employee.x_first_name or employee.x_last_name:
                parts = [employee.x_first_name or '', employee.x_last_name or '']
                employee.name = ' '.join(filter(None, parts))

    @api.depends('hire_date')
    def _compute_seniority(self):
        """Calcule l'ancienneté de l'employé."""
        from dateutil.relativedelta import relativedelta
        today = fields.Date.today()
        for employee in self:
            if employee.x_hire_date:
                delta = relativedelta(today, employee.x_hire_date)
                parts = []
                if delta.years:
                    parts.append(f"{delta.years} an{'s' if delta.years > 1 else ''}")
                if delta.months:
                    parts.append(f"{delta.months} mois")
                employee.x_seniority = ' '.join(parts) if parts else "Moins d'un mois"
            else:
                employee.x_seniority = ''

    # ═══════════════════════════════════════════════════════════════════════════
    # ONCHANGE
    # ═══════════════════════════════════════════════════════════════════════════

    @api.onchange('first_name', 'last_name')
    def _onchange_name_parts(self):
        """Met à jour le nom complet quand prénom/nom changent."""
        if self.x_first_name or self.x_last_name:
            parts = [self.x_first_name or '', self.x_last_name or '']
            self.name = ' '.join(filter(None, parts))

    # ═══════════════════════════════════════════════════════════════════════════
    # CRUD
    # ═══════════════════════════════════════════════════════════════════════════

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            # Générer matricule automatique
            if vals.get('employee_number', 'Nouveau') == 'Nouveau':
                tenant_id = vals.get('tenant_id')
                if tenant_id:
                    tenant = self.env['quelyos.tenant'].browse(tenant_id)
                    sequence = self.env['ir.sequence'].search([
                        ('code', '=', 'quelyos.hr.employee'),
                        ('company_id', '=', tenant.company_id.id)
                    ], limit=1)
                    if sequence:
                        vals['employee_number'] = sequence.next_by_id()
                    else:
                        vals['employee_number'] = self.env['ir.sequence'].next_by_code('quelyos.hr.employee') or 'EMP-0001'

            # Calculer le nom complet
            if vals.get('first_name') or vals.get('last_name'):
                parts = [vals.get('first_name', ''), vals.get('last_name', '')]
                vals['name'] = ' '.join(filter(None, parts))

        return super().create(vals_list)

    def write(self, vals):
        # Recalculer le nom complet si prénom/nom changent
        if 'first_name' in vals or 'last_name' in vals:
            for employee in self:
                first = vals.get('first_name', employee.x_first_name) or ''
                last = vals.get('last_name', employee.x_last_name) or ''
                vals['name'] = ' '.join(filter(None, [first, last]))
        return super().write(vals)

    # ═══════════════════════════════════════════════════════════════════════════
    # MÉTHODES API (pour frontend React)
    # ═══════════════════════════════════════════════════════════════════════════

    def get_employee_data(self, detailed=False):
        """Retourne les données de l'employé pour l'API."""
        self.ensure_one()
        data = {
            'id': self.id,
            'x_employee_number': self.x_employee_number,
            'name': self.name,
            'x_first_name': self.x_first_name or '',
            'x_last_name': self.x_last_name or '',
            'work_email': self.work_email or '',
            'work_phone': self.work_phone or '',
            'mobile_phone': self.mobile_phone or '',
            'department_id': self.department_id.id if self.department_id else None,
            'department_name': self.department_id.name if self.department_id else None,
            'job_id': self.job_id.id if self.job_id else None,
            'job_title': self.job_title or (self.job_id.name if self.job_id else ''),
            'parent_id': self.parent_id.id if self.parent_id else None,
            'parent_name': self.parent_id.name if self.parent_id else None,
            'state': self.x_employee_state,
            'x_hire_date': self.x_hire_date.isoformat() if self.x_hire_date else None,
            'x_seniority': self.x_seniority,
            'attendance_state': self.attendance_state,
            'image_url': f"/web/image/hr.employee/{self.id}/image_128" if self.image_128 else None,
        }

        if detailed:
            data.update({
                'gender': self.gender,
                'birthday': self.birthday.isoformat() if self.birthday else None,
                'place_of_birth': self.place_of_birth or '',
                'country_id': self.country_id.id if self.country_id else None,
                'country_name': self.country_id.name if self.country_id else None,
                'identification_id': self.identification_id or '',
                'x_cin_number': self.x_cin_number or '',
                'x_cnss_number': self.x_cnss_number or '',
                'marital': self.marital,
                'spouse_name': self.spouse_complete_name or '',
                'children': self.children,
                'address': {
                    'street': self.private_street or '',
                    'street2': self.private_street2 or '',
                    'city': self.private_city or '',
                    'state': self.private_state_id.name if self.private_state_id else '',
                    'zip': self.private_zip or '',
                    'country': self.private_country_id.name if self.private_country_id else '',
                },
                'private_email': self.private_email or '',
                'emergency_contact': self.emergency_contact or '',
                'emergency_phone': self.emergency_phone or '',
                'x_bank_name': self.x_bank_name or '',
                'x_bank_account_number': self.x_bank_account_number or '',
                'contract': self.contract_id.get_contract_data() if self.contract_id else None,
                'remaining_leaves': self.remaining_leaves,
                'coach_id': self.coach_id.id if self.coach_id else None,
                'coach_name': self.coach_id.name if self.coach_id else None,
                'departure_date': self.departure_date.isoformat() if self.departure_date else None,
                'departure_reason': self.departure_reason,
            })

        return data

    def get_subordinates_data(self):
        """Retourne la liste des subordonnés."""
        self.ensure_one()
        return [emp.get_employee_data() for emp in self.child_ids.filtered(lambda e: e.employee_state == 'active')]

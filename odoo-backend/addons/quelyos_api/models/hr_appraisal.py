# -*- coding: utf-8 -*-
"""
Modèle pour les évaluations/entretiens RH.
"""
from odoo import models, fields, api
from datetime import date, timedelta


class HRAppraisal(models.Model):
    """Évaluation / Entretien annuel"""
    _name = 'quelyos.hr.appraisal'
    _description = 'Évaluation'
    _order = 'date_scheduled desc, id desc'

    name = fields.Char('Référence', readonly=True, copy=False)
    employee_id = fields.Many2one('hr.employee', string='Employé', required=True, ondelete='cascade')
    manager_id = fields.Many2one('hr.employee', string='Évaluateur',
        related='employee_id.parent_id', store=True, readonly=False)
    department_id = fields.Many2one('hr.department', related='employee_id.department_id', store=True)
    job_id = fields.Many2one('hr.job', related='employee_id.job_id', store=True)

    # Type et période
    appraisal_type = fields.Selection([
        ('annual', 'Entretien annuel'),
        ('probation', 'Fin de période d\'essai'),
        ('mid_year', 'Bilan semestriel'),
        ('project', 'Fin de projet'),
        ('other', 'Autre'),
    ], string='Type', default='annual', required=True)

    period_start = fields.Date('Début période évaluée')
    period_end = fields.Date('Fin période évaluée')

    # Planification
    date_scheduled = fields.Datetime('Date prévue')
    date_done = fields.Date('Date réalisée')
    duration = fields.Float('Durée (heures)', default=1.0)
    location = fields.Char('Lieu')

    # Statut
    state = fields.Selection([
        ('draft', 'Brouillon'),
        ('scheduled', 'Planifié'),
        ('in_progress', 'En cours'),
        ('employee_done', 'Auto-évaluation terminée'),
        ('manager_done', 'Évaluation manager terminée'),
        ('done', 'Terminé'),
        ('cancelled', 'Annulé'),
    ], string='Statut', default='draft', required=True)

    # Scores globaux
    employee_score = fields.Selection([
        ('1', '1 - Insuffisant'),
        ('2', '2 - À améliorer'),
        ('3', '3 - Conforme'),
        ('4', '4 - Bon'),
        ('5', '5 - Excellent'),
    ], string='Auto-évaluation globale')
    manager_score = fields.Selection([
        ('1', '1 - Insuffisant'),
        ('2', '2 - À améliorer'),
        ('3', '3 - Conforme'),
        ('4', '4 - Bon'),
        ('5', '5 - Excellent'),
    ], string='Évaluation manager')
    final_score = fields.Selection([
        ('1', '1 - Insuffisant'),
        ('2', '2 - À améliorer'),
        ('3', '3 - Conforme'),
        ('4', '4 - Bon'),
        ('5', '5 - Excellent'),
    ], string='Note finale')

    # Commentaires
    employee_feedback = fields.Text('Commentaires employé')
    manager_feedback = fields.Text('Commentaires manager')
    strengths = fields.Text('Points forts')
    improvements = fields.Text('Axes d\'amélioration')

    # Objectifs
    goal_ids = fields.One2many('quelyos.hr.goal', 'appraisal_id', string='Objectifs')
    goals_achieved = fields.Integer('Objectifs atteints', compute='_compute_goals_stats', store=True)
    goals_total = fields.Integer('Total objectifs', compute='_compute_goals_stats', store=True)

    # Formation
    training_needs = fields.Text('Besoins en formation')
    training_plan = fields.Text('Plan de formation proposé')

    # Évolution
    promotion_recommended = fields.Boolean('Promotion recommandée')
    salary_increase_recommended = fields.Boolean('Augmentation recommandée')
    career_goals = fields.Text('Objectifs de carrière')

    # Multi-tenant
    tenant_id = fields.Many2one('quelyos.tenant', related='employee_id.tenant_id', store=True)

    @api.model
    def create(self, vals):
        """Génère la référence automatiquement"""
        if not vals.get('name'):
            tenant_id = vals.get('tenant_id')
            if not tenant_id and vals.get('employee_id'):
                employee = self.env['hr.employee'].browse(vals['employee_id'])
                tenant_id = employee.tenant_id.id

            year = date.today().year
            sequence = self.search_count([
                ('tenant_id', '=', tenant_id),
                ('create_date', '>=', f'{year}-01-01'),
            ]) + 1
            vals['name'] = f'EVAL-{year}-{sequence:04d}'

        return super().create(vals)

    @api.depends('goal_ids', 'goal_ids.state')
    def _compute_goals_stats(self):
        for record in self:
            goals = record.goal_ids
            record.goals_total = len(goals)
            record.goals_achieved = len(goals.filtered(lambda g: g.state == 'done'))

    def action_schedule(self):
        """Planifie l'évaluation"""
        self.write({'state': 'scheduled'})

    def action_start(self):
        """Démarre l'évaluation"""
        self.write({'state': 'in_progress'})

    def action_employee_done(self):
        """L'employé a terminé son auto-évaluation"""
        self.write({'state': 'employee_done'})

    def action_manager_done(self):
        """Le manager a terminé son évaluation"""
        self.write({'state': 'manager_done'})

    def action_complete(self):
        """Finalise l'évaluation"""
        self.write({
            'state': 'done',
            'date_done': date.today(),
        })

    def action_cancel(self):
        """Annule l'évaluation"""
        self.write({'state': 'cancelled'})

    def get_appraisal_data(self):
        """Retourne les données complètes pour le frontend"""
        return {
            'id': self.id,
            'name': self.name,
            'employee_id': self.employee_id.id,
            'employee_name': self.employee_id.name,
            'employee_image': self.employee_id.image_url,
            'manager_id': self.manager_id.id if self.manager_id else None,
            'manager_name': self.manager_id.name if self.manager_id else None,
            'department_id': self.department_id.id if self.department_id else None,
            'department_name': self.department_id.name if self.department_id else None,
            'job_id': self.job_id.id if self.job_id else None,
            'job_name': self.job_id.name if self.job_id else None,
            'appraisal_type': self.appraisal_type,
            'appraisal_type_label': dict(self._fields['appraisal_type'].selection).get(self.appraisal_type),
            'period_start': self.period_start.isoformat() if self.period_start else None,
            'period_end': self.period_end.isoformat() if self.period_end else None,
            'date_scheduled': self.date_scheduled.isoformat() if self.date_scheduled else None,
            'date_done': self.date_done.isoformat() if self.date_done else None,
            'duration': self.duration,
            'location': self.location or '',
            'state': self.state,
            'state_label': dict(self._fields['state'].selection).get(self.state),
            'employee_score': self.employee_score,
            'manager_score': self.manager_score,
            'final_score': self.final_score,
            'employee_feedback': self.employee_feedback or '',
            'manager_feedback': self.manager_feedback or '',
            'strengths': self.strengths or '',
            'improvements': self.improvements or '',
            'goals_achieved': self.goals_achieved,
            'goals_total': self.goals_total,
            'training_needs': self.training_needs or '',
            'training_plan': self.training_plan or '',
            'promotion_recommended': self.promotion_recommended,
            'salary_increase_recommended': self.salary_increase_recommended,
            'career_goals': self.career_goals or '',
        }

    def get_appraisal_summary(self):
        """Retourne un résumé pour les listes"""
        return {
            'id': self.id,
            'name': self.name,
            'employee_id': self.employee_id.id,
            'employee_name': self.employee_id.name,
            'manager_name': self.manager_id.name if self.manager_id else None,
            'department_name': self.department_id.name if self.department_id else None,
            'appraisal_type': self.appraisal_type,
            'appraisal_type_label': dict(self._fields['appraisal_type'].selection).get(self.appraisal_type),
            'date_scheduled': self.date_scheduled.isoformat() if self.date_scheduled else None,
            'date_done': self.date_done.isoformat() if self.date_done else None,
            'state': self.state,
            'state_label': dict(self._fields['state'].selection).get(self.state),
            'final_score': self.final_score,
            'goals_achieved': self.goals_achieved,
            'goals_total': self.goals_total,
        }

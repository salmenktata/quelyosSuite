# -*- coding: utf-8 -*-
"""
Participant Workflow Automation.

Représente un contact dans un workflow :
- Tracking progression (activité courante)
- État (running, completed, cancelled)
- Historique activités exécutées
"""

from odoo import models, fields, api
from datetime import timedelta


class MarketingAutomationParticipant(models.Model):
    _name = 'quelyos.marketing.automation.participant'
    _description = 'Participant Workflow Automation'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'create_date desc'

    automation_id = fields.Many2one(
        'quelyos.marketing.automation',
        string='Workflow',
        required=True,
        ondelete='cascade',
        tracking=True
    )
    
    partner_id = fields.Many2one(
        'res.partner',
        string='Contact',
        required=True,
        ondelete='cascade',
        tracking=True
    )
    
    state = fields.Selection([
        ('waiting', 'En Attente'),
        ('running', 'En Cours'),
        ('completed', 'Terminé'),
        ('cancelled', 'Annulé'),
    ], string='État', default='waiting', required=True, tracking=True)
    
    # Progression
    current_activity_id = fields.Many2one(
        'quelyos.marketing.automation.activity',
        string='Activité Courante',
        help='Prochaine activité à exécuter'
    )
    
    next_activity_date = fields.Datetime(
        string='Date Prochaine Activité',
        help='Date exécution prochaine activité'
    )
    
    # Statistiques
    activities_done = fields.Integer(
        string='Activités Réalisées',
        default=0,
        help='Nombre activités exécutées'
    )
    
    activities_total = fields.Integer(
        string='Activités Totales',
        compute='_compute_activities_total',
        help='Nombre total activités dans le workflow'
    )
    
    progress_percent = fields.Float(
        string='Progression (%)',
        compute='_compute_progress',
        help='Pourcentage avancement workflow'
    )

    @api.depends('automation_id.activity_ids')
    def _compute_activities_total(self):
        """Calcule nombre total activités workflow."""
        for participant in self:
            participant.activities_total = len(participant.automation_id.activity_ids)

    @api.depends('activities_done', 'activities_total')
    def _compute_progress(self):
        """Calcule pourcentage progression."""
        for participant in self:
            if participant.activities_total > 0:
                participant.progress_percent = (
                    participant.activities_done / participant.activities_total * 100
                )
            else:
                participant.progress_percent = 0

    def schedule_activity(self, activity):
        """
        Programme une activité pour ce participant.
        
        Args:
            activity (quelyos.marketing.automation.activity)
        """
        self.ensure_one()
        
        # Calculer date exécution
        now = fields.Datetime.now()
        if activity.activity_type == 'wait':
            delay = timedelta(days=activity.wait_days, hours=activity.wait_hours)
            next_date = now + delay
        else:
            next_date = now  # Exécution immédiate
        
        self.write({
            'current_activity_id': activity.id,
            'next_activity_date': next_date,
        })

    def process_next_activity(self):
        """Traite la prochaine activité si due."""
        self.ensure_one()
        
        if not self.current_activity_id:
            # Workflow terminé
            self.write({'state': 'completed'})
            return True
        
        # Vérifier si l'activité est due
        now = fields.Datetime.now()
        if self.next_activity_date and self.next_activity_date > now:
            # Pas encore due
            return False
        
        # Exécuter activité
        executed = self.current_activity_id.execute(self)
        
        if executed:
            # Incrémenter compteur
            self.activities_done += 1
            
            # Passer à l'activité suivante
            activities = self.automation_id.activity_ids.sorted('sequence')
            current_index = activities.ids.index(self.current_activity_id.id)
            
            if current_index < len(activities) - 1:
                # Activité suivante existe
                next_activity = activities[current_index + 1]
                self.schedule_activity(next_activity)
            else:
                # Dernière activité terminée
                self.write({
                    'state': 'completed',
                    'current_activity_id': False,
                    'next_activity_date': False,
                })
                self.message_post(body="Workflow terminé")
        
        return executed

    def action_cancel(self):
        """Annule participation au workflow."""
        self.write({'state': 'cancelled'})
        return True

    def action_restart(self):
        """Redémarre workflow depuis le début."""
        self.write({
            'state': 'running',
            'activities_done': 0,
        })
        # Relancer première activité
        if self.automation_id.activity_ids:
            first = self.automation_id.activity_ids.sorted('sequence')[0]
            self.schedule_activity(first)
        return True

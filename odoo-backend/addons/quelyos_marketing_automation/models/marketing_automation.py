# -*- coding: utf-8 -*-
"""
Workflow Marketing Automation.

Définit un scénario marketing automatisé avec :
- Trigger : événement déclencheur (nouveau contact, commande, date)
- Filtre : conditions d'entrée dans le workflow
- Activités : séquence d'actions automatiques
"""

from odoo import models, fields, api


class MarketingAutomation(models.Model):
    _name = 'quelyos.marketing.automation'
    _description = 'Workflow Marketing Automation'
    _order = 'sequence, name'

    name = fields.Char(
        string='Nom Workflow',
        required=True,
        help='Nom du scénario (ex: "Welcome Email", "Panier Abandonné")'
    )
    
    active = fields.Boolean(
        string='Actif',
        default=True,
        help='Workflow actif = traite les nouveaux participants'
    )
    
    sequence = fields.Integer(
        string='Séquence',
        default=10,
        help='Ordre affichage workflows'
    )
    
    # Trigger configuration
    trigger_type = fields.Selection([
        ('contact_created', 'Nouveau Contact'),
        ('list_added', 'Ajout Liste Diffusion'),
        ('order_placed', 'Commande Passée'),
        ('cart_abandoned', 'Panier Abandonné'),
        ('birthday', 'Anniversaire'),
        ('manual', 'Manuel'),
    ], string='Type Trigger', required=True, default='manual',
       help='Événement déclenchant l\'entrée dans le workflow')
    
    trigger_list_id = fields.Many2one(
        'mailing.list',
        string='Liste Trigger',
        help='Liste déclenchant le workflow (si trigger=list_added)'
    )
    
    # Filtre entrée
    filter_domain = fields.Char(
        string='Domaine Filtre',
        default='[]',
        help='Filtre Odoo domain pour conditions entrée (JSON)'
    )
    
    # Statistiques
    participant_count = fields.Integer(
        string='Participants',
        compute='_compute_statistics',
        help='Nombre total contacts dans le workflow'
    )
    
    active_participant_count = fields.Integer(
        string='Participants Actifs',
        compute='_compute_statistics',
        help='Nombre contacts en cours de workflow'
    )
    
    completed_participant_count = fields.Integer(
        string='Participants Terminés',
        compute='_compute_statistics',
        help='Nombre contacts ayant terminé le workflow'
    )
    
    # Relations
    activity_ids = fields.One2many(
        'quelyos.marketing.automation.activity',
        'automation_id',
        string='Activités',
        help='Séquence activités du workflow'
    )
    
    participant_ids = fields.One2many(
        'quelyos.marketing.automation.participant',
        'automation_id',
        string='Participants',
        help='Contacts dans ce workflow'
    )

    @api.depends('participant_ids.state')
    def _compute_statistics(self):
        """Calcule statistiques participants."""
        for automation in self:
            automation.participant_count = len(automation.participant_ids)
            automation.active_participant_count = len(
                automation.participant_ids.filtered(lambda p: p.state == 'running')
            )
            automation.completed_participant_count = len(
                automation.participant_ids.filtered(lambda p: p.state == 'completed')
            )

    def action_start(self):
        """Active le workflow."""
        self.write({'active': True})
        return True

    def action_stop(self):
        """Désactive le workflow (nouveaux participants bloqués)."""
        self.write({'active': False})
        return True

    def add_participant(self, partner_id):
        """
        Ajoute un contact au workflow.
        
        Args:
            partner_id (int): ID res.partner
        
        Returns:
            quelyos.marketing.automation.participant: Participant créé
        """
        self.ensure_one()
        
        # Vérifier filtre entrée
        partner = self.env['res.partner'].browse(partner_id)
        if self.filter_domain and self.filter_domain != '[]':
            import json
            domain = json.loads(self.filter_domain)
            domain.append(('id', '=', partner_id))
            if not self.env['res.partner'].search(domain):
                return False  # Ne passe pas le filtre
        
        # Vérifier doublon
        existing = self.env['quelyos.marketing.automation.participant'].search([
            ('automation_id', '=', self.id),
            ('partner_id', '=', partner_id),
            ('state', 'in', ['running', 'waiting'])
        ])
        if existing:
            return existing[0]  # Déjà participant
        
        # Créer participant
        participant = self.env['quelyos.marketing.automation.participant'].create({
            'automation_id': self.id,
            'partner_id': partner_id,
            'state': 'running',
        })
        
        # Lancer première activité
        if self.activity_ids:
            first_activity = self.activity_ids.sorted('sequence')[0]
            participant.schedule_activity(first_activity)
        
        return participant

    def cron_process_workflows(self):
        """
        Cron quotidien : traite tous les workflows actifs.
        
        Exécute les activités en attente pour tous participants.
        """
        active_workflows = self.search([('active', '=', True)])
        for workflow in active_workflows:
            workflow.process_activities()
        return True

    def process_activities(self):
        """Traite toutes les activités en attente pour ce workflow."""
        self.ensure_one()
        
        # Récupérer participants actifs
        participants = self.participant_ids.filtered(lambda p: p.state == 'running')
        
        for participant in participants:
            participant.process_next_activity()
        
        return True

# -*- coding: utf-8 -*-
"""
Activité Workflow Automation.

Une activité = une action dans le workflow :
- Envoyer email
- Attendre X jours
- Ajouter à liste
- Ajouter tag
- Modifier score lead
"""

from odoo import models, fields


class MarketingAutomationActivity(models.Model):
    _name = 'quelyos.marketing.automation.activity'
    _description = 'Activité Workflow Automation'
    _order = 'automation_id, sequence'

    automation_id = fields.Many2one(
        'quelyos.marketing.automation',
        string='Workflow',
        required=True,
        ondelete='cascade'
    )
    
    name = fields.Char(
        string='Nom Activité',
        required=True,
        help='Description action (ex: "Email bienvenue", "Attendre 3 jours")'
    )
    
    sequence = fields.Integer(
        string='Séquence',
        default=10,
        help='Ordre exécution dans le workflow'
    )
    
    activity_type = fields.Selection([
        ('email', 'Envoyer Email'),
        ('wait', 'Attendre'),
        ('add_list', 'Ajouter à Liste'),
        ('remove_list', 'Retirer de Liste'),
        ('set_tag', 'Ajouter Tag'),
        ('update_field', 'Modifier Champ'),
    ], string='Type Activité', required=True, default='email')
    
    # Configuration email
    email_template_id = fields.Many2one(
        'mail.template',
        string='Template Email',
        help='Template email à envoyer (si activity_type=email)'
    )
    
    mailing_list_id = fields.Many2one(
        'mailing.list',
        string='Liste Diffusion',
        help='Liste à modifier (si activity_type=add_list/remove_list)'
    )
    
    # Configuration attente
    wait_days = fields.Integer(
        string='Attendre (jours)',
        default=1,
        help='Nombre jours attente avant activité suivante'
    )
    
    wait_hours = fields.Integer(
        string='Attendre (heures)',
        default=0,
        help='Nombre heures attente (ajouté aux jours)'
    )
    
    # Conditions exécution
    condition_domain = fields.Char(
        string='Condition',
        default='[]',
        help='Condition Odoo domain pour exécuter activité (JSON)'
    )

    def execute(self, participant):
        """
        Exécute l'activité pour un participant.
        
        Args:
            participant (quelyos.marketing.automation.participant)
        
        Returns:
            bool: True si exécutée, False si skip
        """
        self.ensure_one()
        
        # Vérifier condition
        if self.condition_domain and self.condition_domain != '[]':
            import json
            domain = json.loads(self.condition_domain)
            domain.append(('id', '=', participant.partner_id.id))
            if not self.env['res.partner'].search(domain):
                return False  # Condition non remplie, skip
        
        # Exécuter action selon type
        if self.activity_type == 'email':
            return self._execute_email(participant)
        elif self.activity_type == 'wait':
            return self._execute_wait(participant)
        elif self.activity_type == 'add_list':
            return self._execute_add_list(participant)
        elif self.activity_type == 'remove_list':
            return self._execute_remove_list(participant)
        elif self.activity_type == 'set_tag':
            return self._execute_set_tag(participant)
        
        return True

    def _execute_email(self, participant):
        """Envoie email via template."""
        if not self.email_template_id:
            return False
        
        # Envoyer email au partner
        self.email_template_id.send_mail(
            participant.partner_id.id,
            force_send=False,  # Queue
            raise_exception=False
        )
        
        # Logger
        participant.message_post(
            body=f"Email envoyé : {self.email_template_id.name}"
        )
        
        return True

    def _execute_wait(self, participant):
        """Configure délai attente."""
        # L'attente est gérée par participant.next_activity_date
        # Ici on retourne juste True
        return True

    def _execute_add_list(self, participant):
        """Ajoute contact à liste diffusion."""
        if not self.mailing_list_id:
            return False
        
        # Créer/update contact mailing
        MailingContact = self.env['mailing.contact']
        contact = MailingContact.search([
            ('email', '=', participant.partner_id.email)
        ], limit=1)
        
        if contact:
            # Ajouter liste si pas déjà présent
            if self.mailing_list_id.id not in contact.list_ids.ids:
                contact.write({
                    'list_ids': [(4, self.mailing_list_id.id)]
                })
        else:
            # Créer contact
            MailingContact.create({
                'name': participant.partner_id.name,
                'email': participant.partner_id.email,
                'list_ids': [(4, self.mailing_list_id.id)]
            })
        
        participant.message_post(
            body=f"Ajouté à liste : {self.mailing_list_id.name}"
        )
        
        return True

    def _execute_remove_list(self, participant):
        """Retire contact de liste diffusion."""
        if not self.mailing_list_id:
            return False
        
        contact = self.env['mailing.contact'].search([
            ('email', '=', participant.partner_id.email),
            ('list_ids', 'in', [self.mailing_list_id.id])
        ], limit=1)
        
        if contact:
            contact.write({
                'list_ids': [(3, self.mailing_list_id.id)]
            })
            participant.message_post(
                body=f"Retiré de liste : {self.mailing_list_id.name}"
            )
        
        return True

    def _execute_set_tag(self, participant):
        """Ajoute tag au contact (placeholder)."""
        # Nécessite module custom tags
        participant.message_post(body="Tag ajouté (placeholder)")
        return True

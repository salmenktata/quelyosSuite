"""
Modèles GMAO personnalisés Quelyos (sans dépendance module Enterprise)
Inspiré de la logique métier IBM Maximo MVP

Modèles créés:
- quelyos.maintenance.equipment - Équipements de maintenance
- quelyos.maintenance.equipment.category - Catégories d'équipements
- quelyos.maintenance.request - Demandes de maintenance
- quelyos.maintenance.stage - Étapes workflow
"""
from odoo import models, fields, api
import logging

_logger = logging.getLogger(__name__)


class MaintenanceEquipmentCategory(models.Model):
    """Catégories d'équipements de maintenance"""
    _name = 'quelyos.maintenance.equipment.category'
    _description = 'Catégorie Équipement Maintenance'
    _order = 'name'

    name = fields.Char(string='Nom', required=True)
    color = fields.Integer(string='Couleur')


class MaintenanceEquipment(models.Model):
    """Équipements de maintenance avec KPIs (logique IBM Maximo)"""
    _name = 'quelyos.maintenance.equipment'
    _description = 'Équipement de Maintenance'
    _order = 'name'

    # Informations de base
    name = fields.Char(string='Nom Équipement', required=True)
    category_id = fields.Many2one(
        'quelyos.maintenance.equipment.category',
        string='Catégorie'
    )
    serial_no = fields.Char(string='Numéro de Série')
    active = fields.Boolean(string='Actif', default=True)

    # Criticité et localisation
    is_critical = fields.Boolean(
        string='Équipement Critique',
        default=False,
        help='Indique si l\'équipement est critique pour l\'activité'
    )
    location = fields.Char(
        string='Localisation',
        help='Emplacement physique de l\'équipement'
    )
    location_id = fields.Many2one(
        'stock.location',
        string='Site/Entrepôt',
        help='Localisation dans un entrepôt (pour filtres avancés)'
    )

    # Dates contractuelles
    purchase_date = fields.Date(
        string='Date d\'achat',
        help='Date d\'acquisition de l\'équipement'
    )
    warranty_end_date = fields.Date(
        string='Fin de garantie',
        help='Date de fin de garantie constructeur'
    )

    # Relations
    maintenance_ids = fields.One2many(
        'quelyos.maintenance.request',
        'equipment_id',
        string='Demandes de Maintenance'
    )

    # KPIs de maintenance (IBM Maximo MVP)
    mtbf_hours = fields.Float(
        string='MTBF (heures)',
        compute='_compute_maintenance_kpis',
        store=True,
        help='Mean Time Between Failures - Temps moyen entre pannes'
    )
    mttr_hours = fields.Float(
        string='MTTR (heures)',
        compute='_compute_maintenance_kpis',
        store=True,
        help='Mean Time To Repair - Temps moyen de réparation'
    )
    uptime_percentage = fields.Float(
        string='Taux Uptime (%)',
        compute='_compute_maintenance_kpis',
        store=True,
        help='Pourcentage de disponibilité de l\'équipement'
    )
    failure_count = fields.Integer(
        string='Nombre de pannes',
        compute='_compute_maintenance_kpis',
        store=True,
        help='Nombre total de pannes enregistrées'
    )
    last_failure_date = fields.Date(
        string='Dernière panne',
        compute='_compute_maintenance_kpis',
        store=True,
        help='Date de la dernière panne enregistrée'
    )
    next_preventive_date = fields.Date(
        string='Prochaine maintenance préventive',
        help='Date planifiée de la prochaine maintenance préventive'
    )

    @api.depends('maintenance_ids', 'maintenance_ids.maintenance_type',
                 'maintenance_ids.stage_id', 'maintenance_ids.actual_duration_hours')
    def _compute_maintenance_kpis(self):
        """
        Calcul automatique des KPIs de maintenance (logique IBM Maximo)
        - MTBF: temps moyen entre pannes
        - MTTR: temps moyen de réparation
        - Uptime: disponibilité
        - Failure count: nombre de pannes
        """
        for equipment in self:
            # Récupération des demandes correctives (pannes) terminées
            corrective_requests = equipment.maintenance_ids.filtered(
                lambda r: r.maintenance_type == 'corrective' and r.stage_id.done
            )

            failure_count = len(corrective_requests)
            equipment.failure_count = failure_count

            if failure_count > 0:
                # Dernière panne
                last_failure = corrective_requests.sorted('create_date', reverse=True)[0]
                equipment.last_failure_date = last_failure.create_date.date() if last_failure.create_date else False

                # MTTR: moyenne des durées de réparation
                total_repair_time = sum(req.actual_duration_hours or 0 for req in corrective_requests)
                equipment.mttr_hours = total_repair_time / failure_count if failure_count > 0 else 0.0

                # MTBF: estimation basée sur l'âge de l'équipement et nombre de pannes
                if equipment.purchase_date:
                    days_in_service = (fields.Date.today() - equipment.purchase_date).days
                    hours_in_service = days_in_service * 24
                    equipment.mtbf_hours = hours_in_service / failure_count if failure_count > 0 else 0.0
                else:
                    equipment.mtbf_hours = 0.0

                # Uptime: estimation basée sur MTBF et MTTR
                if equipment.mtbf_hours > 0:
                    equipment.uptime_percentage = (
                        equipment.mtbf_hours / (equipment.mtbf_hours + equipment.mttr_hours)
                    ) * 100
                else:
                    equipment.uptime_percentage = 100.0
            else:
                # Aucune panne enregistrée
                equipment.last_failure_date = False
                equipment.mttr_hours = 0.0
                equipment.mtbf_hours = 0.0
                equipment.uptime_percentage = 100.0


class MaintenanceStage(models.Model):
    """Étapes du workflow de maintenance"""
    _name = 'quelyos.maintenance.stage'
    _description = 'Étape Maintenance'
    _order = 'sequence, id'

    name = fields.Char(string='Nom', required=True)
    sequence = fields.Integer(string='Séquence', default=10)
    done = fields.Boolean(
        string='Terminé',
        help='Indique si cette étape correspond à une demande terminée'
    )
    fold = fields.Boolean(
        string='Plié',
        help='Plier cette étape dans la vue kanban'
    )


class MaintenanceRequest(models.Model):
    """Demandes de maintenance avec coûts et impact"""
    _name = 'quelyos.maintenance.request'
    _description = 'Demande de Maintenance'
    _order = 'create_date desc'

    # Informations de base
    name = fields.Char(string='Titre', required=True)
    description = fields.Text(string='Description')
    equipment_id = fields.Many2one(
        'quelyos.maintenance.equipment',
        string='Équipement',
        required=True
    )

    # Type et priorité
    maintenance_type = fields.Selection([
        ('corrective', 'Correctif'),
        ('preventive', 'Préventif'),
    ], string='Type', required=True, default='corrective')

    priority = fields.Selection([
        ('0', 'Très faible'),
        ('1', 'Faible'),
        ('2', 'Normale'),
        ('3', 'Haute'),
    ], string='Priorité', default='1')

    # Workflow
    stage_id = fields.Many2one(
        'quelyos.maintenance.stage',
        string='Étape',
        group_expand='_read_group_stage_ids',
        default=lambda self: self._get_default_stage_id()
    )

    # Planification
    schedule_date = fields.Date(string='Date Planifiée')

    # Urgence et impact (IBM Maximo MVP)
    is_emergency = fields.Boolean(
        string='Urgence',
        default=False,
        help='Intervention urgente nécessitant traitement immédiat'
    )
    downtime_impact = fields.Selection([
        ('none', 'Aucun'),
        ('low', 'Faible'),
        ('medium', 'Moyen'),
        ('high', 'Élevé'),
        ('critical', 'Critique'),
    ], string='Impact Temps d\'Arrêt', default='none',
        help='Impact de la panne sur la production/activité')

    # Coûts de maintenance
    total_cost = fields.Float(
        string='Coût Total',
        compute='_compute_total_cost',
        store=True,
        help='Coût total de l\'intervention (pièces + main d\'œuvre)'
    )
    parts_cost = fields.Float(
        string='Coût Pièces',
        help='Coût des pièces détachées utilisées'
    )
    labor_cost = fields.Float(
        string='Coût Main d\'Œuvre',
        help='Coût de la main d\'œuvre'
    )

    # Durée d'intervention
    planned_duration_hours = fields.Float(
        string='Durée Planifiée (h)',
        help='Durée estimée de l\'intervention en heures'
    )
    actual_duration_hours = fields.Float(
        string='Durée Réelle (h)',
        help='Durée réelle de l\'intervention en heures'
    )

    @api.depends('parts_cost', 'labor_cost')
    def _compute_total_cost(self):
        """Calcul automatique du coût total"""
        for request in self:
            request.total_cost = (request.parts_cost or 0.0) + (request.labor_cost or 0.0)

    @api.model
    def _get_default_stage_id(self):
        """Retourne l'étape par défaut (première)"""
        return self.env['quelyos.maintenance.stage'].search([], order='sequence', limit=1)

    @api.model
    def _read_group_stage_ids(self, stages, domain, order):
        """Retourne toutes les étapes pour la vue kanban"""
        return stages.search([], order=order)

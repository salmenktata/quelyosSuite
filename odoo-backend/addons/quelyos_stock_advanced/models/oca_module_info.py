# -*- coding: utf-8 -*-
"""
Modèle pour afficher les informations sur les modules OCA utilisés
"""
from odoo import models, fields, api


class OCAModuleInfo(models.TransientModel):
    _name = 'quelyos.oca.module.info'
    _description = 'Information sur les Modules OCA'

    name = fields.Char(string='Nom du Module', readonly=True)
    display_name = fields.Char(string='Nom Affiché', readonly=True)
    version = fields.Char(string='Version', readonly=True)
    state = fields.Selection([
        ('uninstalled', 'Non Installé'),
        ('installed', 'Installé'),
        ('to upgrade', 'À Mettre à Jour'),
        ('to remove', 'À Supprimer'),
        ('to install', 'À Installer'),
    ], string='État', readonly=True)
    summary = fields.Text(string='Description', readonly=True)
    author = fields.Char(string='Auteur', readonly=True)
    website = fields.Char(string='Site Web', readonly=True)
    is_oca = fields.Boolean(string='Module OCA', readonly=True)
    adaptation_notes = fields.Text(string='Notes d\'Adaptation Odoo 19', readonly=True)

    @api.model
    def get_oca_modules_info(self):
        """
        Récupère les informations sur tous les modules OCA utilisés par Quelyos
        """
        IrModule = self.env['ir.module.module'].sudo()

        # Liste des modules OCA utilisés par quelyos_stock_advanced
        oca_modules = [
            {
                'name': 'stock_change_qty_reason',
                'expected_version': '19.0.1.0.0',
                'description': 'Raisons de changement de quantité stock',
                'features': [
                    'Suivi des raisons lors des ajustements',
                    'Historique des modifications avec justifications',
                    'API REST pour frontend'
                ],
                'adaptation': 'Suppression category_id de res.groups (Odoo 19.0)'
            },
            {
                'name': 'stock_inventory',
                'expected_version': '19.0.1.1.2',
                'description': 'Inventaires améliorés OCA',
                'features': [
                    'Inventaires groupés (restauré depuis Odoo 14)',
                    'Comptage simultané de plusieurs produits',
                    'Workflow inventaire optimisé'
                ],
                'adaptation': 'Aucune modification nécessaire'
            },
            {
                'name': 'stock_location_lockdown',
                'expected_version': '19.0.1.0.0',
                'description': 'Verrouillage d\'emplacements',
                'features': [
                    'Blocage emplacements pendant inventaire',
                    'Prévention mouvements concurrents',
                    'API REST verrouillage/déverrouillage'
                ],
                'adaptation': 'Aucune modification nécessaire'
            },
            {
                'name': 'stock_demand_estimate',
                'expected_version': '19.0.1.1.0',
                'description': 'Estimation de la demande',
                'features': [
                    'Prévisions demande par produit/emplacement',
                    'Planification approvisionnements',
                    'Analyses tendances'
                ],
                'adaptation': 'Suppression attribut expand dans vue search (Odoo 19.0)'
            },
        ]

        result = []
        for module_info in oca_modules:
            module = IrModule.search([('name', '=', module_info['name'])], limit=1)

            if module:
                features_text = '\n'.join([f"• {f}" for f in module_info['features']])

                result.append({
                    'name': module.name,
                    'display_name': module.shortdesc or module.name,
                    'version': module.latest_version or 'N/A',
                    'state': module.state,
                    'summary': f"{module_info['description']}\n\nFonctionnalités:\n{features_text}",
                    'author': module.author or 'Odoo Community Association (OCA)',
                    'website': module.website or 'https://github.com/OCA/stock-logistics-warehouse',
                    'is_oca': True,
                    'adaptation_notes': f"Adaptation Odoo 19.0: {module_info['adaptation']}\nVersion attendue: {module_info['expected_version']}"
                })
            else:
                # Module non trouvé
                result.append({
                    'name': module_info['name'],
                    'display_name': module_info['description'],
                    'version': 'Non trouvé',
                    'state': 'uninstalled',
                    'summary': f"{module_info['description']}\n\nModule non détecté dans le système.",
                    'author': 'Odoo Community Association (OCA)',
                    'website': 'https://github.com/OCA/stock-logistics-warehouse',
                    'is_oca': True,
                    'adaptation_notes': f"Module non installé. Version attendue: {module_info['expected_version']}"
                })

        return result

    @api.model
    def get_summary_stats(self):
        """
        Retourne des statistiques sur les modules OCA
        """
        modules_info = self.get_oca_modules_info()

        total = len(modules_info)
        installed = sum(1 for m in modules_info if m['state'] == 'installed')
        uninstalled = sum(1 for m in modules_info if m['state'] == 'uninstalled')

        return {
            'total': total,
            'installed': installed,
            'uninstalled': uninstalled,
            'installation_rate': round((installed / total * 100) if total > 0 else 0, 2)
        }

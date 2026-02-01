# -*- coding: utf-8 -*-
"""
Contrôleur API REST pour Listes de Diffusion Marketing (mailing.list natif Odoo 19).

Endpoints :
- GET /api/ecommerce/marketing/lists - Liste listes de diffusion
- POST /api/ecommerce/marketing/lists/create - Créer liste
- GET /api/ecommerce/marketing/lists/:id - Détail liste
- POST /api/ecommerce/marketing/lists/:id/contacts - Ajouter contacts
- DELETE /api/ecommerce/marketing/lists/:id/contacts/:contact_id - Retirer contact
- DELETE /api/ecommerce/marketing/lists/:id/delete - Supprimer liste
"""

import json
from odoo import http
from odoo.http import request


class MarketingListsController(http.Controller):
    """API REST pour Listes de Diffusion Marketing."""

    @http.route('/api/ecommerce/marketing/lists', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def list_mailing_lists(self, tenant_id=None, limit=100, offset=0, **kwargs):
        """
        Liste des listes de diffusion.

        Returns:
            dict: {
                'success': bool,
                'mailing_lists': list,
                'total_count': int
            }
        """
        try:
            domain = []

            if tenant_id:
                domain.append(('company_id', '=', tenant_id))

            MailingList = request.env['mailing.list'].sudo()
            total_count = MailingList.search_count(domain)
            mailing_lists = MailingList.search(domain, limit=limit, offset=offset, order='name')

            lists_data = []
            for mlist in mailing_lists:
                lists_data.append({
                    'id': mlist.id,
                    'name': mlist.name,
                    'active': mlist.active,
                    'contact_count': mlist.contact_count,
                    'create_date': mlist.create_date.isoformat() if mlist.create_date else None,
                })

            return {
                'success': True,
                'mailing_lists': lists_data,
                'total_count': total_count,
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e),
            }

    @http.route('/api/ecommerce/marketing/lists/create', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def create_mailing_list(self, name, tenant_id=None, **kwargs):
        """Créer une liste de diffusion."""
        try:
            vals = {'name': name}

            if tenant_id:
                vals['company_id'] = tenant_id

            mailing_list = request.env['mailing.list'].sudo().create(vals)

            return {
                'success': True,
                'mailing_list': {
                    'id': mailing_list.id,
                    'name': mailing_list.name,
                },
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e),
            }

    @http.route('/api/ecommerce/marketing/lists/<int:list_id>', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_mailing_list(self, list_id, **kwargs):
        """Détail d'une liste avec ses contacts."""
        try:
            mailing_list = request.env['mailing.list'].sudo().browse(list_id)

            if not mailing_list.exists():
                return {'success': False, 'error': 'Mailing list not found'}

            # Récupérer contacts
            contacts_data = []
            for contact in mailing_list.contact_ids:
                contacts_data.append({
                    'id': contact.id,
                    'email': contact.email,
                    'name': contact.name,
                    'subscription_list_ids': contact.subscription_list_ids.ids,
                })

            return {
                'success': True,
                'mailing_list': {
                    'id': mailing_list.id,
                    'name': mailing_list.name,
                    'active': mailing_list.active,
                    'contact_count': mailing_list.contact_count,
                    'contacts': contacts_data,
                },
            }

        except Exception as e:
            return {'success': False, 'error': str(e)}

    @http.route('/api/ecommerce/marketing/lists/<int:list_id>/contacts', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def add_contacts_to_list(self, list_id, contacts, **kwargs):
        """
        Ajouter contacts à une liste.

        Args:
            list_id (int): ID liste
            contacts (list): Liste [{email, name}, ...]

        Returns:
            dict: {'success': bool, 'added_count': int}
        """
        try:
            mailing_list = request.env['mailing.list'].sudo().browse(list_id)

            if not mailing_list.exists():
                return {'success': False, 'error': 'Mailing list not found'}

            added_count = 0
            Contact = request.env['mailing.contact'].sudo()

            for contact_data in contacts:
                email = contact_data.get('email')
                name = contact_data.get('name', email)

                if not email:
                    continue

                # Vérifier si contact existe
                existing = Contact.search([('email', '=', email)], limit=1)

                if existing:
                    # Ajouter à la liste si pas déjà présent
                    if mailing_list.id not in existing.list_ids.ids:
                        existing.write({'list_ids': [(4, mailing_list.id)]})
                        added_count += 1
                else:
                    # Créer nouveau contact
                    Contact.create({
                        'email': email,
                        'name': name,
                        'list_ids': [(4, mailing_list.id)],
                    })
                    added_count += 1

            return {
                'success': True,
                'added_count': added_count,
            }

        except Exception as e:
            return {'success': False, 'error': str(e)}

    @http.route('/api/ecommerce/marketing/lists/<int:list_id>/delete', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def delete_mailing_list(self, list_id, **kwargs):
        """Supprimer une liste de diffusion."""
        try:
            mailing_list = request.env['mailing.list'].sudo().browse(list_id)

            if not mailing_list.exists():
                return {'success': False, 'error': 'Mailing list not found'}

            mailing_list.unlink()

            return {'success': True}

        except Exception as e:
            return {'success': False, 'error': str(e)}

    @http.route('/api/ecommerce/marketing/lists/<int:list_id>/contacts', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def add_contacts_to_list(self, list_id, contact_ids, **kwargs):
        """Ajouter contacts à une liste."""
        try:
            mailing_list = request.env['mailing.list'].sudo().browse(list_id)

            if not mailing_list.exists():
                return {'success': False, 'error': 'Mailing list not found'}

            # Créer contacts mailing pour chaque partner
            MailingContact = request.env['mailing.contact'].sudo()
            added_count = 0

            for partner_id in contact_ids:
                partner = request.env['res.partner'].sudo().browse(partner_id)
                if partner.exists() and partner.email:
                    # Vérifier si contact déjà dans la liste
                    existing = MailingContact.search([
                        ('email', '=', partner.email),
                        ('list_ids', 'in', [list_id])
                    ], limit=1)

                    if not existing:
                        MailingContact.create({
                            'name': partner.name,
                            'email': partner.email,
                            'list_ids': [(4, list_id)],
                        })
                        added_count += 1

            return {
                'success': True,
                'added_count': added_count,
            }

        except Exception as e:
            return {'success': False, 'error': str(e)}

    @http.route('/api/ecommerce/marketing/lists/<int:list_id>/contacts/<int:contact_id>', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def remove_contact_from_list(self, list_id, contact_id, **kwargs):
        """Retirer contact d'une liste."""
        try:
            contact = request.env['mailing.contact'].sudo().browse(contact_id)

            if not contact.exists():
                return {'success': False, 'error': 'Contact not found'}

            # Retirer liste du contact
            contact.write({
                'list_ids': [(3, list_id)]  # Unlink
            })

            return {
                'success': True,
            }

        except Exception as e:
            return {'success': False, 'error': str(e)}

    @http.route('/api/ecommerce/marketing/lists/<int:list_id>/delete', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def delete_mailing_list(self, list_id, **kwargs):
        """Supprimer une liste de diffusion."""
        try:
            mailing_list = request.env['mailing.list'].sudo().browse(list_id)

            if not mailing_list.exists():
                return {'success': False, 'error': 'Mailing list not found'}

            mailing_list.unlink()

            return {
                'success': True,
            }

        except Exception as e:
            return {'success': False, 'error': str(e)}

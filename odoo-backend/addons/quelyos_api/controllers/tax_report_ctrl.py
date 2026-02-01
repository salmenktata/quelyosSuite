# -*- coding: utf-8 -*-
"""Contrôleur Déclarations TVA"""

import logging
import xml.etree.ElementTree as ET
from datetime import datetime
from odoo import http
from odoo.http import request
from .base import BaseController

_logger = logging.getLogger(__name__)


class TaxReportController(BaseController):
    """API Déclarations TVA"""

    @http.route('/api/finance/tax-reports', type='json', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def get_tax_reports(self, **params):
        """Liste des déclarations TVA"""
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            year = params.get('year', datetime.now().year)

            # Simuler des rapports TVA (en production, utiliser un modèle custom)
            reports = []
            for month in range(1, 13):
                reports.append({
                    'id': month,
                    'year': year,
                    'month': month,
                    'country': 'FR',
                    'dateFrom': f"{year}-{month:02d}-01",
                    'dateTo': f"{year}-{month:02d}-28",
                    'vatCollected': 2000.0 * month,
                    'vatDeductible': 1500.0 * month,
                    'vatNet': 500.0 * month,
                    'state': 'draft' if month >= datetime.now().month else 'submitted',
                })

            data = {
                'reports': reports,
                'total': len(reports),
            }

            return self._success_response(data)

        except Exception as e:
            _logger.error(f"Erreur get_tax_reports: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/tax-reports/generate', type='json', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def generate_tax_report(self, **params):
        """Générer déclaration TVA pour une période"""
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            data = request.jsonrequest
            
            year = data.get('year')
            month = data.get('month')

            # Calculer TVA collectée (factures clients)
            AccountMove = request.env['account.move'].sudo()
            
            date_from = f"{year}-{month:02d}-01"
            import calendar
            last_day = calendar.monthrange(year, month)[1]
            date_to = f"{year}-{month:02d}-{last_day}"
            
            out_invoices = AccountMove.search([
                ('tenant_id', '=', tenant_id),
                ('move_type', '=', 'out_invoice'),
                ('state', '=', 'posted'),
                ('invoice_date', '>=', date_from),
                ('invoice_date', '<=', date_to),
            ])
            
            vat_collected = sum(inv.amount_tax for inv in out_invoices)
            
            # TVA déductible (achats)
            in_invoices = AccountMove.search([
                ('tenant_id', '=', tenant_id),
                ('move_type', '=', 'in_invoice'),
                ('state', '=', 'posted'),
                ('invoice_date', '>=', date_from),
                ('invoice_date', '<=', date_to),
            ])
            
            vat_deductible = sum(inv.amount_tax for inv in in_invoices)
            
            report = {
                'id': f"{year}{month:02d}",
                'year': year,
                'month': month,
                'country': 'FR',
                'dateFrom': date_from,
                'dateTo': date_to,
                'vatCollected': float(vat_collected),
                'vatDeductible': float(vat_deductible),
                'vatNet': float(vat_collected - vat_deductible),
                'state': 'draft',
            }

            return self._success_response(report, message=f"Déclaration TVA {year}-{month:02d} générée")

        except Exception as e:
            _logger.error(f"Erreur generate_tax_report: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/tax-reports/<int:report_id>/export-edi-tva', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def export_edi_tva(self, report_id, **params):
        """Export EDI-TVA XML (France)"""
        try:
            # Générer XML EDI-TVA
            root = ET.Element('EDI_TVA')
            root.set('version', '2.0')
            
            header = ET.SubElement(root, 'Entete')
            ET.SubElement(header, 'Emetteur').text = 'Quelyos'
            ET.SubElement(header, 'DateEmission').text = datetime.now().strftime('%Y-%m-%d')
            
            declaration = ET.SubElement(root, 'Declaration')
            ET.SubElement(declaration, 'Periode').text = f"2026-{report_id:02d}"
            ET.SubElement(declaration, 'TVACollectee').text = "2000.00"
            ET.SubElement(declaration, 'TVADeductible').text = "1500.00"
            ET.SubElement(declaration, 'TVANette').text = "500.00"
            
            xml_str = ET.tostring(root, encoding='unicode', method='xml')
            xml_content = f'<?xml version="1.0" encoding="UTF-8"?>\n{xml_str}'
            
            filename = f"edi-tva-2026-{report_id:02d}.xml"
            headers = [
                ('Content-Type', 'application/xml'),
                ('Content-Disposition', f'attachment; filename="{filename}"'),
            ]

            return request.make_response(xml_content, headers=headers)

        except Exception as e:
            _logger.error(f"Erreur export_edi_tva: {e}", exc_info=True)
            return request.make_response(str(e), status=500)

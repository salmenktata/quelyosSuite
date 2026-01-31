# Phase 2 : Conformité Fiscale & Banque

**Durée** : 6 semaines (Q2 2026)
**Parité cible** : 45% → 65%
**Priorité** : P0 (Critique)

---

## 🎯 Objectifs de la Phase 2

Implémenter les fonctionnalités essentielles pour :
1. **Conformité fiscale** : Déclarations TVA (France + Belgique)
2. **Automatisation bancaire** : Import relevés + réconciliation AI
3. **Reporting réglementaire** : Bilan, Compte de Résultat, FEC

### Livrables

| # | Module | Endpoints | Pages UI | Tests |
|---|--------|-----------|----------|-------|
| 1 | Déclarations TVA | 6 | 2 | 20 |
| 2 | Import Relevés Bancaires | 5 | 1 | 15 |
| 3 | Rapprochement Bancaire AI | 7 | 1 | 25 |
| 4 | Rapports Financiers | 5 | 3 | 20 |
| **TOTAL** | **4 modules** | **23** | **7** | **80** |

---

## 📦 Livrable 1 : Déclarations TVA

### Fonctionnalités Odoo 19 à Implémenter

| Feature | Odoo 19 | Quelyos Status |
|---------|---------|----------------|
| Calcul TVA collectée | ✅ | ❌ Manquant |
| Calcul TVA déductible | ✅ | ❌ Manquant |
| Déclaration CA3 (France) | ✅ | ❌ Manquant |
| Export EDI-TVA XML (France) | ✅ | ❌ Manquant |
| Déclaration TVA (Belgique) | ✅ | ❌ Manquant |
| Export INTERVAT XML (Belgique) | ✅ | ❌ Manquant |
| Historique déclarations | ✅ | ❌ Manquant |
| Clôture période TVA | ✅ | ❌ Manquant |

### Backend : Endpoints API

**Fichier** : `odoo-backend/addons/quelyos_api/controllers/tax_report_ctrl.py`

```python
# -*- coding: utf-8 -*-
"""
Contrôleur Déclarations TVA
Gère les déclarations de TVA pour France (CA3, EDI-TVA) et Belgique (INTERVAT)
"""

import logging
import xml.etree.ElementTree as ET
from datetime import datetime
from odoo import http
from odoo.http import request
from .base import BaseController

_logger = logging.getLogger(__name__)


class TaxReportController(BaseController):
    """API Déclarations TVA"""

    @http.route('/api/finance/tax-reports', type='json', auth='public', methods=['GET', 'OPTIONS'], cors='*', csrf=False)
    def get_tax_reports(self, **params):
        """
        Liste des déclarations TVA avec filtres
        
        Query params:
        - year: int (ex: 2026)
        - month: int (1-12)
        - status: draft|posted|submitted
        - country: FR|BE
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            if not tenant_id:
                return self._error_response("Tenant non trouvé", "FORBIDDEN", 403)

            # Paramètres
            year = params.get('year')
            month = params.get('month')
            status = params.get('status', 'all')
            country = params.get('country', 'FR')

            # Domain
            domain = [
                ('tenant_id', '=', tenant_id),
            ]

            if year:
                domain.append(('year', '=', int(year)))
            if month:
                domain.append(('month', '=', int(month)))
            if status != 'all':
                domain.append(('state', '=', status))
            if country:
                domain.append(('country_code', '=', country))

            # Recherche (on utilise un modèle custom quelyos.tax.report)
            TaxReport = request.env['quelyos.tax.report'].sudo()
            reports = TaxReport.search(domain, order='year desc, month desc')
            
            data = {
                'reports': [self._serialize_tax_report(report) for report in reports],
                'total': len(reports),
            }

            return self._success_response(data)

        except Exception as e:
            _logger.error(f"Erreur get_tax_reports: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/tax-reports/<int:report_id>', type='json', auth='public', methods=['GET', 'OPTIONS'], cors='*', csrf=False)
    def get_tax_report(self, report_id, **params):
        """Détail d'une déclaration TVA"""
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)

            TaxReport = request.env['quelyos.tax.report'].sudo()
            report = TaxReport.search([
                ('id', '=', report_id),
                ('tenant_id', '=', tenant_id),
            ], limit=1)

            if not report:
                return self._error_response("Déclaration introuvable", "NOT_FOUND", 404)

            data = self._serialize_tax_report(report, include_lines=True)
            return self._success_response(data)

        except Exception as e:
            _logger.error(f"Erreur get_tax_report {report_id}: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/tax-reports/generate', type='json', auth='public', methods=['POST', 'OPTIONS'], cors='*', csrf=False)
    def generate_tax_report(self, **params):
        """
        Générer une déclaration TVA pour une période donnée
        
        Body:
        {
          "year": 2026,
          "month": 1,
          "country": "FR"
        }
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)

            data = request.jsonrequest
            year = data.get('year')
            month = data.get('month')
            country = data.get('country', 'FR')

            if not year or not month:
                return self._error_response("Année et mois requis", "VALIDATION_ERROR", 400)

            # Période
            date_from = f"{year}-{month:02d}-01"
            
            # Calculer date_to (dernier jour du mois)
            import calendar
            last_day = calendar.monthrange(year, month)[1]
            date_to = f"{year}-{month:02d}-{last_day}"

            # Calculer TVA collectée (factures clients validées)
            AccountMove = request.env['account.move'].sudo()
            
            # TVA collectée (ventes)
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
            
            # TVA nette à payer
            vat_net = vat_collected - vat_deductible

            # Créer le rapport
            TaxReport = request.env['quelyos.tax.report'].sudo()
            report = TaxReport.create({
                'tenant_id': tenant_id,
                'year': year,
                'month': month,
                'country_code': country,
                'date_from': date_from,
                'date_to': date_to,
                'vat_collected': vat_collected,
                'vat_deductible': vat_deductible,
                'vat_net': vat_net,
                'state': 'draft',
            })

            _logger.info(f"Déclaration TVA {year}-{month:02d} générée (ID: {report.id})")

            return self._success_response(
                self._serialize_tax_report(report, include_lines=True),
                message=f"Déclaration TVA {year}-{month:02d} générée"
            )

        except Exception as e:
            _logger.error(f"Erreur generate_tax_report: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/tax-reports/<int:report_id>/export-edi-tva', type='http', auth='public', methods=['GET', 'OPTIONS'], cors='*', csrf=False)
    def export_edi_tva(self, report_id, **params):
        """
        Export EDI-TVA XML (format DGFiP France)
        
        Référence: https://www.impots.gouv.fr/portail/professionnel/edi-tva-tdfc
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return request.make_response(
                    json.dumps({'success': False, 'error': 'Unauthorized'}),
                    headers=[('Content-Type', 'application/json')],
                    status=401
                )

            tenant_id = self._get_tenant_id(user)

            TaxReport = request.env['quelyos.tax.report'].sudo()
            report = TaxReport.search([
                ('id', '=', report_id),
                ('tenant_id', '=', tenant_id),
                ('country_code', '=', 'FR'),
            ], limit=1)

            if not report:
                return request.make_response(
                    json.dumps({'success': False, 'error': 'Not found'}),
                    headers=[('Content-Type', 'application/json')],
                    status=404
                )

            # Générer XML EDI-TVA
            xml_content = self._generate_edi_tva_xml(report)

            # Retourner le XML
            filename = f"edi-tva-{report.year}-{report.month:02d}.xml"
            headers = [
                ('Content-Type', 'application/xml'),
                ('Content-Disposition', f'attachment; filename="{filename}"'),
            ]

            return request.make_response(xml_content, headers=headers)

        except Exception as e:
            _logger.error(f"Erreur export_edi_tva {report_id}: {e}", exc_info=True)
            return request.make_response(
                json.dumps({'success': False, 'error': str(e)}),
                headers=[('Content-Type', 'application/json')],
                status=500
            )

    @http.route('/api/finance/tax-reports/<int:report_id>/export-intervat', type='http', auth='public', methods=['GET', 'OPTIONS'], cors='*', csrf=False)
    def export_intervat(self, report_id, **params):
        """
        Export INTERVAT XML (format SPF Finances Belgique)
        
        Référence: https://finances.belgium.be/fr/E-services/Intervat
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return request.make_response(
                    json.dumps({'success': False, 'error': 'Unauthorized'}),
                    headers=[('Content-Type', 'application/json')],
                    status=401
                )

            tenant_id = self._get_tenant_id(user)

            TaxReport = request.env['quelyos.tax.report'].sudo()
            report = TaxReport.search([
                ('id', '=', report_id),
                ('tenant_id', '=', tenant_id),
                ('country_code', '=', 'BE'),
            ], limit=1)

            if not report:
                return request.make_response(
                    json.dumps({'success': False, 'error': 'Not found'}),
                    headers=[('Content-Type', 'application/json')],
                    status=404
                )

            # Générer XML INTERVAT
            xml_content = self._generate_intervat_xml(report)

            # Retourner le XML
            filename = f"intervat-{report.year}-{report.month:02d}.xml"
            headers = [
                ('Content-Type', 'application/xml'),
                ('Content-Disposition', f'attachment; filename="{filename}"'),
            ]

            return request.make_response(xml_content, headers=headers)

        except Exception as e:
            _logger.error(f"Erreur export_intervat {report_id}: {e}", exc_info=True)
            return request.make_response(
                json.dumps({'success': False, 'error': str(e)}),
                headers=[('Content-Type', 'application/json')],
                status=500
            )

    @http.route('/api/finance/tax-reports/<int:report_id>/submit', type='json', auth='public', methods=['POST', 'OPTIONS'], cors='*', csrf=False)
    def submit_tax_report(self, report_id, **params):
        """Marquer une déclaration comme soumise à l'administration fiscale"""
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)

            TaxReport = request.env['quelyos.tax.report'].sudo()
            report = TaxReport.search([
                ('id', '=', report_id),
                ('tenant_id', '=', tenant_id),
            ], limit=1)

            if not report:
                return self._error_response("Déclaration introuvable", "NOT_FOUND", 404)

            # Vérifier l'état
            if report.state == 'submitted':
                return self._error_response("Cette déclaration est déjà soumise", "VALIDATION_ERROR", 400)

            # Marquer comme soumise
            report.write({
                'state': 'submitted',
                'submit_date': datetime.now(),
            })

            _logger.info(f"Déclaration TVA {report.year}-{report.month:02d} soumise")

            return self._success_response(
                self._serialize_tax_report(report),
                message="Déclaration soumise avec succès"
            )

        except Exception as e:
            _logger.error(f"Erreur submit_tax_report {report_id}: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    # ─────────────────────────────────────────────────────────────────────
    # HELPER METHODS
    # ─────────────────────────────────────────────────────────────────────

    def _serialize_tax_report(self, report, include_lines=False):
        """Convertir quelyos.tax.report en format frontend"""
        data = {
            'id': report.id,
            'year': report.year,
            'month': report.month,
            'country': report.country_code,
            'dateFrom': report.date_from.isoformat() if report.date_from else None,
            'dateTo': report.date_to.isoformat() if report.date_to else None,
            'vatCollected': float(report.vat_collected),
            'vatDeductible': float(report.vat_deductible),
            'vatNet': float(report.vat_net),
            'state': report.state,
            'submitDate': report.submit_date.isoformat() if report.submit_date else None,
            'createdAt': report.create_date.isoformat() if report.create_date else None,
        }

        if include_lines:
            # Détail des lignes de TVA par taux
            data['lines'] = [
                {
                    'taxRate': float(line.tax_rate),
                    'baseAmount': float(line.base_amount),
                    'taxAmount': float(line.tax_amount),
                    'type': line.tax_type,  # 'collected' | 'deductible'
                }
                for line in report.line_ids
            ]

        return data

    def _generate_edi_tva_xml(self, report):
        """
        Générer XML EDI-TVA conforme DGFiP
        
        Format simplifié (voir doc officielle pour format complet)
        """
        root = ET.Element('EDI_TVA')
        root.set('version', '2.0')
        
        # En-tête
        header = ET.SubElement(root, 'Entete')
        ET.SubElement(header, 'Emetteur').text = 'Quelyos'
        ET.SubElement(header, 'DateEmission').text = datetime.now().strftime('%Y-%m-%d')
        
        # Déclaration
        declaration = ET.SubElement(root, 'Declaration')
        ET.SubElement(declaration, 'Periode').text = f"{report.year}-{report.month:02d}"
        ET.SubElement(declaration, 'Regime').text = 'CA3'  # Régime normal
        
        # TVA collectée
        collected = ET.SubElement(declaration, 'TVACollectee')
        ET.SubElement(collected, 'Montant').text = str(report.vat_collected)
        
        # TVA déductible
        deductible = ET.SubElement(declaration, 'TVADeductible')
        ET.SubElement(deductible, 'Montant').text = str(report.vat_deductible)
        
        # TVA nette
        ET.SubElement(declaration, 'TVANette').text = str(report.vat_net)
        
        # Convertir en string XML
        xml_str = ET.tostring(root, encoding='unicode', method='xml')
        return f'<?xml version="1.0" encoding="UTF-8"?>\n{xml_str}'

    def _generate_intervat_xml(self, report):
        """
        Générer XML INTERVAT conforme SPF Finances Belgique
        
        Format simplifié (voir doc officielle pour format complet)
        """
        root = ET.Element('IntervatDeclaration')
        root.set('xmlns', 'http://www.minfin.fgov.be/IntervatDeclaration')
        root.set('version', '4.0')
        
        # En-tête
        header = ET.SubElement(root, 'Header')
        ET.SubElement(header, 'SenderID').text = 'Quelyos'
        ET.SubElement(header, 'SubmissionDate').text = datetime.now().strftime('%Y-%m-%d')
        
        # Déclaration
        declaration = ET.SubElement(root, 'VATDeclaration')
        ET.SubElement(declaration, 'Period').text = f"{report.year}{report.month:02d}"
        ET.SubElement(declaration, 'DeclarationType').text = 'Monthly'
        
        # Grille 54 : Opérations soumises à la TVA (CA HT)
        ET.SubElement(declaration, 'Grid54').text = '0.00'  # TODO: calculer base HT
        
        # Grille 55 : TVA collectée
        ET.SubElement(declaration, 'Grid55').text = str(report.vat_collected)
        
        # Grille 59 : TVA déductible
        ET.SubElement(declaration, 'Grid59').text = str(report.vat_deductible)
        
        # Grille 71 : TVA nette à payer
        ET.SubElement(declaration, 'Grid71').text = str(report.vat_net)
        
        # Convertir en string XML
        xml_str = ET.tostring(root, encoding='unicode', method='xml')
        return f'<?xml version="1.0" encoding="UTF-8"?>\n{xml_str}'


# Modèle custom quelyos.tax.report (à créer dans models/)
"""
class QuelyosTaxReport(models.Model):
    _name = 'quelyos.tax.report'
    _description = 'Déclaration TVA'
    
    tenant_id = fields.Many2one('quelyos.tenant', required=True, index=True)
    year = fields.Integer(required=True)
    month = fields.Integer(required=True)
    country_code = fields.Char(size=2, default='FR')
    date_from = fields.Date(required=True)
    date_to = fields.Date(required=True)
    
    vat_collected = fields.Monetary(string='TVA Collectée', currency_field='currency_id')
    vat_deductible = fields.Monetary(string='TVA Déductible', currency_field='currency_id')
    vat_net = fields.Monetary(string='TVA Nette', currency_field='currency_id', compute='_compute_vat_net', store=True)
    
    state = fields.Selection([
        ('draft', 'Brouillon'),
        ('posted', 'Validée'),
        ('submitted', 'Soumise'),
    ], default='draft')
    
    submit_date = fields.Datetime()
    currency_id = fields.Many2one('res.currency', default=lambda self: self.env.company.currency_id)
    line_ids = fields.One2many('quelyos.tax.report.line', 'report_id')
    
    @api.depends('vat_collected', 'vat_deductible')
    def _compute_vat_net(self):
        for rec in self:
            rec.vat_net = rec.vat_collected - rec.vat_deductible
"""
```

### Frontend : Page Déclarations TVA

**Fichier** : `dashboard-client/src/pages/finance/tax-declarations/page.tsx`

```typescript
/**
 * Page Déclarations TVA
 * 
 * Fonctionnalités:
 * - Liste des déclarations TVA par période
 * - Génération automatique depuis factures
 * - Export EDI-TVA (France) ou INTERVAT (Belgique)
 * - Calcul TVA collectée/déductible/nette
 */

import { useState } from 'react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, Button, PageNotice } from '@/components/common'
import { financeNotices } from '@/lib/notices'
import { FileDown, Plus, Send, CheckCircle, Clock } from 'lucide-react'
import { useTaxReports } from '@/hooks/useTaxReports'
import { formatCurrency } from '@/lib/utils'

export default function TaxDeclarationsPage() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [country, setCountry] = useState('FR')
  
  const { 
    reports, 
    loading, 
    error,
    generate,
    exportEdiTva,
    exportIntervat,
    submit
  } = useTaxReports({ year, country })

  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ]

  const handleGenerate = async (month: number) => {
    if (confirm(`Générer la déclaration TVA pour ${months[month - 1]} ${year} ?`)) {
      await generate(year, month, country)
    }
  }

  const handleExport = async (reportId: number) => {
    if (country === 'FR') {
      await exportEdiTva(reportId)
    } else {
      await exportIntervat(reportId)
    }
  }

  return (
    <Layout>
      <Breadcrumbs
        items={[
          { label: 'Finance', path: '/finance' },
          { label: 'Déclarations TVA', path: '/finance/tax-declarations' },
        ]}
      />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Déclarations TVA
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Générez et exportez vos déclarations TVA mensuelles
        </p>
      </div>

      <PageNotice notices={financeNotices.taxDeclarations} />

      {/* Filtres */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Année
            </label>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {[2026, 2025, 2024].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Pays
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="FR">France (CA3 / EDI-TVA)</option>
              <option value="BE">Belgique (INTERVAT)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grille mensuelle */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {months.map((month, index) => {
          const monthNum = index + 1
          const report = reports.find(r => r.month === monthNum)

          return (
            <div
              key={monthNum}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {month}
                </h3>
                
                {report ? (
                  <div>
                    {report.state === 'submitted' ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Soumise
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                        <Clock className="w-3 h-3 mr-1" />
                        Brouillon
                      </span>
                    )}
                  </div>
                ) : null}
              </div>

              {report ? (
                <>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">TVA collectée</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(report.vatCollected, '€')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">TVA déductible</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(report.vatDeductible, '€')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-gray-200 dark:border-gray-700">
                      <span className="font-medium text-gray-700 dark:text-gray-300">TVA nette</span>
                      <span className={`font-bold ${report.vatNet > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        {formatCurrency(report.vatNet, '€')}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={FileDown}
                      onClick={() => handleExport(report.id)}
                      fullWidth
                    >
                      Export
                    </Button>
                    
                    {report.state !== 'submitted' && (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={Send}
                        onClick={() => submit(report.id)}
                        fullWidth
                      >
                        Soumettre
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  icon={Plus}
                  onClick={() => handleGenerate(monthNum)}
                  fullWidth
                >
                  Générer
                </Button>
              )}
            </div>
          )
        })}
      </div>
    </Layout>
  )
}
```

**Hook** : `dashboard-client/src/hooks/useTaxReports.ts`

```typescript
import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'

interface UseTaxReportsParams {
  year?: number
  country?: string
}

export function useTaxReports(params: UseTaxReportsParams = {}) {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchReports()
  }, [params.year, params.country])

  const fetchReports = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiClient.post('/finance/tax-reports', params)
      
      if (response.data.success) {
        setReports(response.data.data.reports)
      } else {
        setError(response.data.error || 'Erreur lors du chargement')
      }
    } catch (err: any) {
      setError(err.message || 'Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  const generate = async (year: number, month: number, country: string) => {
    try {
      const response = await apiClient.post('/finance/tax-reports/generate', {
        year,
        month,
        country,
      })
      
      if (response.data.success) {
        fetchReports() // Reload
        alert('Déclaration générée avec succès')
      } else {
        throw new Error(response.data.error)
      }
    } catch (err: any) {
      alert(`Erreur: ${err.message}`)
    }
  }

  const exportEdiTva = async (reportId: number) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/finance/tax-reports/${reportId}/export-edi-tva`,
        {
          headers: {
            'X-Session-Id': localStorage.getItem('session_id') || '',
          },
        }
      )
      
      if (!response.ok) throw new Error('Erreur téléchargement')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `edi-tva-${reportId}.xml`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      alert(`Erreur: ${err.message}`)
    }
  }

  const exportIntervat = async (reportId: number) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/finance/tax-reports/${reportId}/export-intervat`,
        {
          headers: {
            'X-Session-Id': localStorage.getItem('session_id') || '',
          },
        }
      )
      
      if (!response.ok) throw new Error('Erreur téléchargement')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `intervat-${reportId}.xml`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      alert(`Erreur: ${err.message}`)
    }
  }

  const submit = async (reportId: number) => {
    if (!confirm('Confirmer la soumission de cette déclaration ?')) return
    
    try {
      const response = await apiClient.post(`/finance/tax-reports/${reportId}/submit`)
      
      if (response.data.success) {
        fetchReports() // Reload
        alert('Déclaration soumise avec succès')
      } else {
        throw new Error(response.data.error)
      }
    } catch (err: any) {
      alert(`Erreur: ${err.message}`)
    }
  }

  return {
    reports,
    loading,
    error,
    generate,
    exportEdiTva,
    exportIntervat,
    submit,
    reload: fetchReports,
  }
}
```

---

## 📦 Livrable 2-4 : Aperçu Rapide

### Livrable 2 : Import Relevés Bancaires
- `controllers/bank_statements_ctrl.py` (5 endpoints)
- `pages/finance/bank-statements/import/page.tsx`
- Support formats : CSV, OFX, CAMT.053 (ISO 20022), MT940 (SWIFT)

### Livrable 3 : Rapprochement Bancaire AI
- `controllers/bank_reconciliation_ctrl.py` (7 endpoints)
- `pages/finance/bank-reconciliation/page.tsx`
- ML Scoring : Matching automatique 0-100 (règles + similarité)
- Split-view : Lignes bancaires | Écritures comptables

### Livrable 4 : Rapports Financiers
- `controllers/financial_reports_ctrl.py` (5 endpoints)
- `pages/finance/reports/balance-sheet/page.tsx`
- `pages/finance/reports/profit-loss/page.tsx`
- `pages/finance/reports/fec-export/page.tsx`
- Bilan, Compte de Résultat, FEC (Fichier des Écritures Comptables)

---

## 🎯 Résumé Phase 2

### KPIs de Succès

| Métrique | Objectif |
|----------|----------|
| Parité fonctionnelle | 65% |
| Endpoints API | 23 |
| Pages UI | 7 |
| Tests automatisés | 80 |
| Temps génération TVA | < 30 sec |
| Taux matching bancaire AI | > 80% |
| Export FEC conforme | 100% |

---

**Auteur** : Claude Code - Audit Parité Fonctionnelle
**Date** : 2026-01-31
**Version** : 1.0

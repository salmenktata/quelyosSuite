# -*- coding: utf-8 -*-
"""Contrôleur SEPA Direct Debit (pain.008)"""

import logging
from datetime import datetime, timedelta
from odoo import http
from odoo.http import request
from .base import BaseController

_logger = logging.getLogger(__name__)


class SEPADirectDebitController(BaseController):
    """API SEPA Direct Debit (pain.008.001.02)"""

    @http.route('/api/finance/sepa/mandates', type='json', auth='public', methods=['GET', 'OPTIONS'], cors='*', csrf=False)
    def get_mandates(self, **params):
        """
        Liste mandats SEPA Direct Debit
        
        Query params:
        - status: str (active, inactive, revoked)
        - customer_id: int
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            status = params.get('status', 'active')
            
            # TODO: Récupérer mandats depuis modèle Odoo
            # Modèle : sdd.mandate (module account_payment_mode)
            
            # Simuler mandats
            mandates = [
                {
                    'id': 1,
                    'reference': 'MNDT-2026-001',
                    'customerId': 1,
                    'customerName': 'Client ACME SARL',
                    'iban': 'FR7630004001234567890123456',
                    'bic': 'BNPAFRPPXXX',
                    'type': 'RCUR',  # Récurrent (vs OOFF one-off)
                    'scheme': 'CORE',  # CORE vs B2B
                    'signatureDate': '2026-01-15',
                    'status': 'active',
                    'createdAt': '2026-01-15T10:00:00Z',
                },
                {
                    'id': 2,
                    'reference': 'MNDT-2026-002',
                    'customerId': 2,
                    'customerName': 'Client Beta SAS',
                    'iban': 'FR7630003012345678901234567',
                    'bic': 'SOGEFRPPXXX',
                    'type': 'RCUR',
                    'scheme': 'B2B',
                    'signatureDate': '2026-01-20',
                    'status': 'active',
                    'createdAt': '2026-01-20T14:30:00Z',
                },
            ]
            
            if status != 'all':
                mandates = [m for m in mandates if m['status'] == status]
            
            return self._success_response({'mandates': mandates})

        except Exception as e:
            _logger.error(f"Erreur get_mandates: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/sepa/mandates/create', type='json', auth='public', methods=['POST', 'OPTIONS'], cors='*', csrf=False)
    def create_mandate(self, **params):
        """
        Créer nouveau mandat SEPA
        
        Body params:
        - customer_id: int
        - iban: str
        - bic: str (optional, auto-detected)
        - type: str (RCUR or OOFF)
        - scheme: str (CORE or B2B)
        - signature_date: YYYY-MM-DD
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            customer_id = params.get('customer_id')
            iban = params.get('iban')
            
            if not customer_id or not iban:
                return self._error_response("customer_id et iban requis", "VALIDATION_ERROR", 400)
            
            # TODO: Créer dans modèle Odoo
            # mandate = request.env['sdd.mandate'].sudo().create({...})
            
            # Générer référence unique
            reference = f"MNDT-{datetime.now().year}-{str(customer_id).zfill(3)}"
            
            mandate = {
                'id': 3,
                'reference': reference,
                'customerId': customer_id,
                'iban': iban,
                'bic': params.get('bic', 'BNPAFRPPXXX'),
                'type': params.get('type', 'RCUR'),
                'scheme': params.get('scheme', 'CORE'),
                'signatureDate': params.get('signature_date', datetime.now().date().isoformat()),
                'status': 'active',
                'createdAt': datetime.now().isoformat(),
            }
            
            return self._success_response(mandate)

        except Exception as e:
            _logger.error(f"Erreur create_mandate: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/sepa/direct-debits', type='json', auth='public', methods=['GET', 'OPTIONS'], cors='*', csrf=False)
    def get_direct_debits(self, **params):
        """
        Liste prélèvements SEPA à effectuer
        
        Query params:
        - status: str (pending, sent, rejected)
        - date_from: YYYY-MM-DD
        - date_to: YYYY-MM-DD
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            
            # Simuler prélèvements
            direct_debits = [
                {
                    'id': 1,
                    'reference': 'DD-2026-001',
                    'mandateReference': 'MNDT-2026-001',
                    'customerId': 1,
                    'customerName': 'Client ACME SARL',
                    'amount': 1200.00,
                    'currency': 'EUR',
                    'requestedDate': '2026-02-05',
                    'sequenceType': 'RCUR',  # FRST (first), RCUR (recurring), OOFF, FNAL
                    'status': 'pending',
                    'createdAt': '2026-01-28T10:00:00Z',
                },
                {
                    'id': 2,
                    'reference': 'DD-2026-002',
                    'mandateReference': 'MNDT-2026-002',
                    'customerId': 2,
                    'customerName': 'Client Beta SAS',
                    'amount': 3500.00,
                    'currency': 'EUR',
                    'requestedDate': '2026-02-10',
                    'sequenceType': 'FRST',
                    'status': 'pending',
                    'createdAt': '2026-01-29T15:00:00Z',
                },
            ]
            
            return self._success_response({'directDebits': direct_debits})

        except Exception as e:
            _logger.error(f"Erreur get_direct_debits: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/sepa/direct-debits/export', type='http', auth='public', methods=['GET', 'OPTIONS'], cors='*', csrf=False)
    def export_pain008(self, **params):
        """
        Export fichier XML pain.008.001.02 (SEPA Direct Debit)
        
        Query params:
        - debit_ids: list[int] (IDs prélèvements à inclure)
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return request.make_response('Unauthorized', status=401)

            tenant_id = self._get_tenant_id(user)
            
            # TODO: Génération XML réelle avec lxml
            # from lxml import etree
            # Schéma : pain.008.001.02 (ISO 20022)
            
            # Simuler XML pain.008
            pain008_xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.008.001.02">
  <CstmrDrctDbtInitn>
    <GrpHdr>
      <MsgId>MSG-{datetime.now().strftime('%Y%m%d-%H%M%S')}</MsgId>
      <CreDtTm>{datetime.now().isoformat()}</CreDtTm>
      <NbOfTxs>2</NbOfTxs>
      <CtrlSum>4700.00</CtrlSum>
      <InitgPty>
        <Nm>QUELYOS COMPANY</Nm>
        <Id>
          <OrgId>
            <Othr>
              <Id>FR12345678901</Id>
            </Othr>
          </OrgId>
        </Id>
      </InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>BATCH-001</PmtInfId>
      <PmtMtd>DD</PmtMtd>
      <NbOfTxs>2</NbOfTxs>
      <CtrlSum>4700.00</CtrlSum>
      <ReqdColltnDt>2026-02-05</ReqdColltnDt>
      <Cdtr>
        <Nm>QUELYOS COMPANY</Nm>
      </Cdtr>
      <CdtrAcct>
        <Id>
          <IBAN>FR7630004000011234567890189</IBAN>
        </Id>
      </CdtrAcct>
      <CdtrAgt>
        <FinInstnId>
          <BIC>BNPAFRPPXXX</BIC>
        </FinInstnId>
      </CdtrAgt>
      <DrctDbtTxInf>
        <PmtId>
          <EndToEndId>DD-2026-001</EndToEndId>
        </PmtId>
        <InstdAmt Ccy="EUR">1200.00</InstdAmt>
        <DrctDbtTx>
          <MndtRltdInf>
            <MndtId>MNDT-2026-001</MndtId>
            <DtOfSgntr>2026-01-15</DtOfSgntr>
          </MndtRltdInf>
        </DrctDbtTx>
        <DbtrAgt>
          <FinInstnId>
            <BIC>BNPAFRPPXXX</BIC>
          </FinInstnId>
        </DbtrAgt>
        <Dbtr>
          <Nm>Client ACME SARL</Nm>
        </Dbtr>
        <DbtrAcct>
          <Id>
            <IBAN>FR7630004001234567890123456</IBAN>
          </Id>
        </DbtrAcct>
      </DrctDbtTxInf>
    </PmtInf>
  </CstmrDrctDbtInitn>
</Document>"""

            filename = f"pain008-{datetime.now().strftime('%Y%m%d')}.xml"
            headers = [
                ('Content-Type', 'application/xml; charset=utf-8'),
                ('Content-Disposition', f'attachment; filename="{filename}"'),
            ]

            return request.make_response(pain008_xml.encode('utf-8'), headers=headers)

        except Exception as e:
            _logger.error(f"Erreur export_pain008: {e}", exc_info=True)
            return request.make_response(str(e), status=500)

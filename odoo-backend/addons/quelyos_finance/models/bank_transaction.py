# -*- coding: utf-8 -*-
"""
Modèle Transactions Bancaires (Agrégation Multi-Sources)

Agrège transactions depuis :
- Stripe (webhooks temps réel)
- PayPal (API REST)
- Open Banking DSP2 (Bridge API, Powens, Bankin)
- Import manuel CSV/OFX/CAMT.053

Normalise format pour matching intelligent avec écritures comptables

Workflow :
1. Import transaction (webhook/API/CSV)
2. Normalisation (montant, date, libellé)
3. Détection doublon (hash)
4. Enrichissement métadonnées (catégorie, tags)
5. Matching automatique avec factures/paiements
6. Génération écritures comptables (411/512/627)
7. Lettrage automatique

Features :
- Détection frais automatique (ex: Stripe 2,25€ sur 100€)
- Split transactions (un virement = plusieurs factures)
- Multi-devises (conversion automatique)
- Gestion rejets/annulations
"""

import logging
import hashlib
from datetime import datetime, timedelta
from odoo import models, fields, api
from odoo.exceptions import UserError

_logger = logging.getLogger(__name__)


class BankTransaction(models.Model):
    """Transaction bancaire normalisée"""

    _name = 'quelyos.bank_transaction'
    _description = 'Transaction Bancaire'
    _order = 'transaction_date desc, id desc'
    _rec_name = 'label'

    # Relations
    tenant_id = fields.Many2one('quelyos.tenant', string='Tenant', required=True, index=True)
    bank_account_id = fields.Many2one(
        'res.partner.bank',
        string='Compte bancaire',
        help='Compte bancaire source (RIB/IBAN)',
        index=True
    )

    # Identifiant unique
    transaction_hash = fields.Char(
        string='Hash transaction',
        help='Hash unique pour détecter doublons',
        index=True,
        readonly=True
    )
    external_id = fields.Char(
        string='ID externe',
        help='ID transaction source (Stripe, PayPal, Bridge...)',
        index=True
    )

    # Source transaction
    source_type = fields.Selection(
        [
            ('stripe', 'Stripe'),
            ('paypal', 'PayPal'),
            ('open_banking', 'Open Banking'),
            ('manual', 'Import Manuel'),
        ],
        string='Source',
        required=True,
        default='open_banking',
        index=True
    )
    source_provider = fields.Char(
        string='Fournisseur',
        help='Bridge API, Powens, Bankin, etc.'
    )

    # Données transaction
    transaction_date = fields.Date(string='Date transaction', required=True, index=True)
    value_date = fields.Date(
        string='Date valeur',
        help='Date effective sur compte bancaire',
        index=True
    )
    label = fields.Char(string='Libellé', required=True)
    label_normalized = fields.Char(
        string='Libellé normalisé',
        help='Version nettoyée pour matching',
        compute='_compute_label_normalized',
        store=True
    )

    # Montants
    amount = fields.Monetary(string='Montant', required=True, currency_field='currency_id')
    currency_id = fields.Many2one('res.currency', string='Devise', required=True)
    amount_company_currency = fields.Monetary(
        string='Montant devise société',
        currency_field='company_currency_id',
        compute='_compute_amount_company_currency',
        store=True
    )
    company_currency_id = fields.Many2one(
        'res.currency',
        string='Devise société',
        related='tenant_id.company_id.currency_id',
        store=True
    )

    # Débit/Crédit
    transaction_type = fields.Selection(
        [('debit', 'Débit'), ('credit', 'Crédit')],
        string='Type',
        compute='_compute_transaction_type',
        store=True,
        index=True
    )

    # Catégorisation
    category = fields.Selection(
        [
            ('customer_payment', 'Encaissement Client'),
            ('supplier_payment', 'Paiement Fournisseur'),
            ('fee', 'Frais Bancaires'),
            ('transfer', 'Virement Interne'),
            ('tax', 'Impôts/Taxes'),
            ('salary', 'Salaires'),
            ('other', 'Autre'),
        ],
        string='Catégorie',
        compute='_compute_category',
        store=True,
        index=True
    )

    # Statut réconciliation
    state = fields.Selection(
        [
            ('pending', 'À Réconcilier'),
            ('matched', 'Réconcilié Auto'),
            ('manual', 'Réconcilié Manuel'),
            ('split', 'Split (Partiel)'),
            ('excluded', 'Exclu'),
        ],
        string='Statut',
        default='pending',
        required=True,
        index=True
    )

    # Matching
    matched_invoice_id = fields.Many2one('account.move', string='Facture liée', index=True)
    matched_payment_id = fields.Many2one('account.payment', string='Paiement lié', index=True)
    matched_amount = fields.Monetary(
        string='Montant réconcilié',
        currency_field='currency_id',
        help='Montant effectivement réconcilié (peut être < amount si split)'
    )
    matching_confidence = fields.Float(
        string='Confiance matching (%)',
        help='Score confiance algorithme matching (0-100)',
        digits=(5, 2)
    )

    # Écritures comptables générées
    move_line_ids = fields.One2many(
        'account.move.line',
        'quelyos_bank_transaction_id',
        string='Écritures comptables'
    )

    # Métadonnées
    notes = fields.Text(string='Notes')
    created_at = fields.Datetime(string='Importé le', default=fields.Datetime.now, readonly=True)

    # Contraintes
    _sql_constraints = [
        (
            'unique_transaction_hash',
            'UNIQUE(tenant_id, transaction_hash)',
            'Transaction déjà importée (doublon détecté)'
        )
    ]

    @api.depends('label')
    def _compute_label_normalized(self):
        """Normaliser libellé pour matching"""
        for record in self:
            if record.label:
                # Supprimer caractères spéciaux, dates, références
                import re
                normalized = record.label.upper()
                # Supprimer dates (JJ/MM/AAAA, AAAA-MM-JJ)
                normalized = re.sub(r'\d{2}[/-]\d{2}[/-]\d{4}', '', normalized)
                normalized = re.sub(r'\d{4}[/-]\d{2}[/-]\d{2}', '', normalized)
                # Supprimer numéros (références, etc.)
                normalized = re.sub(r'\b\d{6,}\b', '', normalized)
                # Supprimer mots vides
                stop_words = ['VIR', 'VIREMENT', 'SEPA', 'DE', 'POUR', 'REF', 'REFERENCE']
                for word in stop_words:
                    normalized = normalized.replace(word, '')
                # Nettoyer espaces multiples
                normalized = ' '.join(normalized.split())
                record.label_normalized = normalized.strip()
            else:
                record.label_normalized = ''

    @api.depends('amount', 'currency_id', 'transaction_date')
    def _compute_amount_company_currency(self):
        """Convertir montant en devise société"""
        for record in self:
            if record.currency_id == record.company_currency_id:
                record.amount_company_currency = record.amount
            else:
                # Conversion avec taux du jour
                rate_date = record.transaction_date or fields.Date.today()
                record.amount_company_currency = record.currency_id._convert(
                    record.amount,
                    record.company_currency_id,
                    record.tenant_id.company_id,
                    rate_date
                )

    @api.depends('amount')
    def _compute_transaction_type(self):
        """Débit ou crédit"""
        for record in self:
            record.transaction_type = 'credit' if record.amount > 0 else 'debit'

    @api.depends('label_normalized', 'amount', 'transaction_type')
    def _compute_category(self):
        """Catégoriser transaction automatiquement"""
        for record in self:
            label = record.label_normalized or record.label or ''
            label_upper = label.upper()

            # Règles catégorisation
            if record.transaction_type == 'credit':
                # Crédit = encaissement
                if any(kw in label_upper for kw in ['STRIPE', 'PAYPAL', 'CB', 'CARTE']):
                    record.category = 'customer_payment'
                else:
                    record.category = 'customer_payment'  # Par défaut crédit = client
            else:
                # Débit = décaissement
                if any(kw in label_upper for kw in ['FRAIS', 'COMMISSION', 'COTISATION']):
                    record.category = 'fee'
                elif any(kw in label_upper for kw in ['IMPOT', 'URSSAF', 'TVA']):
                    record.category = 'tax'
                elif any(kw in label_upper for kw in ['SALAIRE', 'PAIE']):
                    record.category = 'salary'
                elif any(kw in label_upper for kw in ['VIREMENT', 'TRANSFER']):
                    record.category = 'transfer'
                else:
                    record.category = 'supplier_payment'  # Par défaut débit = fournisseur

    @api.model
    def create(self, vals):
        """Générer hash transaction pour détection doublons"""
        if not vals.get('transaction_hash'):
            # Hash basé sur : date + montant + libellé + compte
            hash_data = f"{vals.get('transaction_date')}-{vals.get('amount')}-{vals.get('label')}-{vals.get('bank_account_id')}"
            vals['transaction_hash'] = hashlib.md5(hash_data.encode()).hexdigest()

        return super(BankTransaction, self).create(vals)

    def action_match_automatically(self):
        """
        Matching automatique avec factures/paiements

        Algorithme :
        1. Recherche exacte (montant + référence facture dans libellé)
        2. Recherche fuzzy (montant ±0,5% + nom client dans libellé)
        3. Recherche pattern (Stripe charge ID, PayPal transaction ID)
        4. ML scoring (si modèle entraîné)

        Returns:
            dict: Résultats matching
        """
        self.ensure_one()

        if self.state != 'pending':
            raise UserError("Transaction déjà réconciliée")

        # 1. Matching exact par référence
        match = self._match_by_reference()
        if match:
            return self._apply_match(match, confidence=100.0, method='reference')

        # 2. Matching fuzzy par montant + nom
        match = self._match_by_amount_and_name()
        if match:
            return self._apply_match(match, confidence=85.0, method='fuzzy')

        # 3. Matching pattern (Stripe, PayPal)
        match = self._match_by_pattern()
        if match:
            return self._apply_match(match, confidence=90.0, method='pattern')

        # Aucun match trouvé
        _logger.info(f"Aucun match automatique pour transaction {self.id} ({self.label})")
        return {
            'success': False,
            'message': 'Aucune correspondance automatique trouvée',
        }

    def _match_by_reference(self):
        """Matching par référence facture dans libellé"""
        AccountMove = self.env['account.move'].sudo()

        # Extraire numéros potentiels du libellé
        import re
        numbers = re.findall(r'\b(INV|FACT?)\s*[/-]?\s*(\d{4,})\b', self.label.upper())

        for prefix, number in numbers:
            # Chercher facture avec cette référence
            invoice = AccountMove.search([
                ('tenant_id', '=', self.tenant_id.id),
                ('move_type', '=', 'out_invoice'),
                ('name', 'ilike', number),
                ('state', '=', 'posted'),
                ('payment_state', 'in', ['not_paid', 'partial']),
            ], limit=1)

            if invoice:
                # Vérifier montant cohérent (±0,5%)
                tolerance = abs(self.amount) * 0.005
                if abs(abs(self.amount) - invoice.amount_residual) <= tolerance:
                    return {'invoice': invoice, 'type': 'invoice'}

        return None

    def _match_by_amount_and_name(self):
        """Matching fuzzy par montant + nom client"""
        AccountMove = self.env['account.move'].sudo()

        # Tolérance montant ±0,5%
        tolerance = abs(self.amount) * 0.005
        min_amount = abs(self.amount) - tolerance
        max_amount = abs(self.amount) + tolerance

        # Chercher factures avec montant similaire
        invoices = AccountMove.search([
            ('tenant_id', '=', self.tenant_id.id),
            ('move_type', '=', 'out_invoice'),
            ('state', '=', 'posted'),
            ('payment_state', 'in', ['not_paid', 'partial']),
            ('amount_residual', '>=', min_amount),
            ('amount_residual', '<=', max_amount),
        ], limit=10)

        # Chercher nom client dans libellé
        label_upper = self.label.upper()
        for invoice in invoices:
            partner_name = invoice.partner_id.name.upper()
            # Matching si nom client présent dans libellé (≥50% nom)
            if len(partner_name) >= 4:
                words = partner_name.split()
                matches = sum(1 for word in words if len(word) >= 4 and word in label_upper)
                if matches >= len(words) * 0.5:
                    return {'invoice': invoice, 'type': 'invoice'}

        return None

    def _match_by_pattern(self):
        """Matching par pattern spécifique (Stripe, PayPal)"""
        if self.source_type == 'stripe':
            # Pattern Stripe: charge ID (ch_xxx) ou payment intent (pi_xxx)
            import re
            charge_ids = re.findall(r'\b(ch_[a-zA-Z0-9]{24}|pi_[a-zA-Z0-9]{24})\b', self.label)
            if charge_ids:
                # TODO: Chercher dans métadonnées factures Stripe
                pass

        elif self.source_type == 'paypal':
            # Pattern PayPal: transaction ID (xxx-yyy-zzz)
            import re
            txn_ids = re.findall(r'\b([A-Z0-9]{17})\b', self.label)
            if txn_ids:
                # TODO: Chercher dans métadonnées factures PayPal
                pass

        return None

    def _apply_match(self, match, confidence, method):
        """Appliquer matching et créer écritures comptables"""
        if match['type'] == 'invoice':
            invoice = match['invoice']

            # Mettre à jour transaction
            self.write({
                'state': 'matched',
                'matched_invoice_id': invoice.id,
                'matched_amount': abs(self.amount),
                'matching_confidence': confidence,
            })

            # Générer écriture comptable (411 → 512)
            self._generate_accounting_entry(invoice)

            _logger.info(
                f"Transaction {self.id} réconciliée avec facture {invoice.name} "
                f"(méthode: {method}, confiance: {confidence:.1f}%)"
            )

            return {
                'success': True,
                'message': f'Réconcilié avec facture {invoice.name}',
                'invoice': invoice,
                'confidence': confidence,
            }

        return {'success': False}

    def _generate_accounting_entry(self, invoice):
        """Générer écriture comptable automatique"""
        AccountMove = self.env['account.move'].sudo()
        AccountMoveLine = self.env['account.move.line'].sudo()

        # Créer pièce comptable
        move_vals = {
            'journal_id': self.bank_account_id.journal_id.id if self.bank_account_id.journal_id else None,
            'date': self.transaction_date,
            'ref': f"Rapprochement {self.label[:50]}",
            'tenant_id': self.tenant_id.id,
        }

        move = AccountMove.create(move_vals)

        # Ligne 1: Débit compte banque (512)
        AccountMoveLine.create({
            'move_id': move.id,
            'account_id': self.bank_account_id.journal_id.default_account_id.id,
            'name': self.label,
            'debit': abs(self.amount),
            'credit': 0,
            'quelyos_bank_transaction_id': self.id,
        })

        # Ligne 2: Crédit compte client (411)
        AccountMoveLine.create({
            'move_id': move.id,
            'account_id': invoice.partner_id.property_account_receivable_id.id,
            'partner_id': invoice.partner_id.id,
            'name': f"Encaissement {invoice.name}",
            'debit': 0,
            'credit': abs(self.amount),
        })

        # Valider pièce
        move.action_post()

        # Lettrer avec facture
        invoice_line = invoice.line_ids.filtered(
            lambda l: l.account_id == invoice.partner_id.property_account_receivable_id
        )
        payment_line = move.line_ids.filtered(
            lambda l: l.account_id == invoice.partner_id.property_account_receivable_id
        )
        if invoice_line and payment_line:
            (invoice_line | payment_line).reconcile()

        _logger.info(f"Écriture comptable générée : {move.name}")


# Extension account.move.line pour lien transaction
class AccountMoveLine(models.Model):
    _inherit = 'account.move.line'

    quelyos_bank_transaction_id = fields.Many2one(
        'quelyos.bank_transaction',
        string='Transaction Bancaire',
        help='Transaction bancaire source (si rapprochement auto)',
        index=True
    )

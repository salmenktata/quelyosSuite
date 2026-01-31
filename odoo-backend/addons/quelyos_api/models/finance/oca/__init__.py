# -*- coding: utf-8 -*-
"""Modules OCA Fusionnés - Finance (12 modules)"""

# Phase 1 : Rapports Financiers (4 modules)
from . import partner_ledger
from . import aged_receivables
from . import trial_balance
from . import fec_export

# Phase 2 : Conformité France (4 modules)
from . import general_ledger
from . import das2
from . import vat_cash_basis
from . import fr_siret

# Phase 3 : Paiements (3 modules)
from . import payment_multi_day
from . import payment_return
from . import payment_sepa

# Phase 4 : Réconciliation (1 module)
from . import advanced_reconciliation

/**
 * Nouvelle Dépense - Formulaire d'enregistrement dépense
 *
 * Fonctionnalités :
 * - Saisie rapide dépense avec montant, date et description
 * - Association catégorie et compte bancaire
 * - Upload justificatifs (factures, reçus)
 * - Tags personnalisés pour classification
 * - Validation et enregistrement
 */
import { TransactionFormPage } from '@/components/finance/transactions/TransactionFormPage'

export default function ExpensesNewPage() {
  return <TransactionFormPage transactionType="expense" />
}

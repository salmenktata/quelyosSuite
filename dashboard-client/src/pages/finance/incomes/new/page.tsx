/**
 * Nouveau Revenu - Formulaire d'enregistrement revenu
 *
 * Fonctionnalités :
 * - Saisie rapide revenu avec montant, date et description
 * - Association catégorie et compte bancaire
 * - Upload justificatifs (factures, contrats)
 * - Tags personnalisés pour classification
 * - Validation et enregistrement
 */
import { TransactionFormPage } from '@/components/finance/transactions/TransactionFormPage'

export default function IncomesNewPage() {
  return <TransactionFormPage transactionType="income" />
}

/**
 * Nouveau Fournisseur - Formulaire d'ajout fournisseur
 *
 * Fonctionnalités :
 * - Enregistrement nouveau fournisseur avec coordonnées complètes
 * - Configuration délais de paiement (Net 30, Net 45, etc.)
 * - Informations fiscales (TVA, SIRET)
 * - Contacts et notes
 * - Validation formulaire
 */
import SupplierForm from '@/components/finance/suppliers/SupplierForm'

export const metadata = {
  title: 'Nouveau fournisseur - Quelyos',
  description: 'Ajoutez un nouveau fournisseur',
}

export default function NewSupplierPage() {
  return <SupplierForm mode="create" />
}

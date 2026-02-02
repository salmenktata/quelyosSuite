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
import { Layout } from '@/components/Layout'
import SupplierForm from '@/components/finance/suppliers/SupplierForm'

// eslint-disable-next-line react-refresh/only-export-components
export const metadata = {
  title: 'Nouveau fournisseur - Quelyos',
  description: 'Ajoutez un nouveau fournisseur',
}

export default function NewSupplierPage() {
  return (
    <Layout>
      <SupplierForm mode="create" />
    </Layout>
  )
}

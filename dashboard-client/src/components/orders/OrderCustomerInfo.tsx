interface Customer {
  name: string
  email: string
  phone?: string | null
  street?: string | null
  zip?: string | null
  city?: string | null
  country?: string | null
}

interface OrderCustomerInfoProps {
  customer: Customer | null
}

/**
 * Section informations client de la commande
 * Responsive : grid 2 colonnes sur desktop, 1 colonne sur mobile
 */
export function OrderCustomerInfo({ customer }: OrderCustomerInfoProps) {
  if (!customer) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 md:p-6">
        <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Informations client
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Aucune information client</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 md:p-6">
      <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Informations client
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Nom</p>
          <p className="text-sm md:text-base font-medium text-gray-900 dark:text-white">{customer.name}</p>
        </div>
        <div>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Email</p>
          <p className="text-sm md:text-base font-medium text-gray-900 dark:text-white break-all">
            {customer.email}
          </p>
        </div>
        <div>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Téléphone</p>
          <p className="text-sm md:text-base font-medium text-gray-900 dark:text-white">
            {customer.phone || '-'}
          </p>
        </div>
        <div>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Adresse</p>
          <p className="text-sm md:text-base font-medium text-gray-900 dark:text-white">
            {customer.street || '-'}
          </p>
        </div>
        <div>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Ville</p>
          <p className="text-sm md:text-base font-medium text-gray-900 dark:text-white">
            {customer.zip} {customer.city}
          </p>
        </div>
        <div>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Pays</p>
          <p className="text-sm md:text-base font-medium text-gray-900 dark:text-white">
            {customer.country || '-'}
          </p>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Layout } from '../components/Layout'
import { useSiteConfig, useUpdateSiteConfig } from '../hooks/useSiteConfig'
import { Button, Breadcrumbs, Skeleton } from '../components/common'
import { useToast } from '../contexts/ToastContext'

export default function SiteConfig() {
  const toast = useToast()
  const { data, isLoading, error } = useSiteConfig()
  const updateMutation = useUpdateSiteConfig()

  // État local pour les toggles
  const [features, setFeatures] = useState({
    compare_enabled: true,
    wishlist_enabled: true,
    reviews_enabled: true,
    newsletter_enabled: true,
  })

  // État local pour la configuration du catalogue
  const [catalogConfig, setCatalogConfig] = useState({
    viewers_count_enabled: true,
    sort_options: ['name', 'newest', 'price_asc', 'price_desc', 'popular'] as string[],
    pagination_options: [12, 24, 36, 48] as number[],
  })

  // État local pour les informations de contact
  const [contactConfig, setContactConfig] = useState({
    whatsapp_number: '+21600000000',
    contact_email: 'contact@quelyos.com',
    contact_phone: '+21600000000',
  })

  // État local pour la configuration livraison
  const [shippingConfig, setShippingConfig] = useState({
    shipping_standard_days: '2-5',
    shipping_express_days: '1-2',
    free_shipping_threshold: 150,
  })

  // État local pour la configuration retours
  const [returnsConfig, setReturnsConfig] = useState({
    return_delay_days: 30,
    refund_delay_days: '7-10',
  })

  // État local pour la garantie
  const [warrantyConfig, setWarrantyConfig] = useState({
    warranty_years: 2,
  })

  // État local pour les modes de paiement
  const [paymentMethods, setPaymentMethods] = useState<string[]>(['card', 'cash', 'transfer', 'mobile'])

  // Charger les données depuis l'API
  useEffect(() => {
    if (data) {
      setFeatures({
        compare_enabled: data.compare_enabled ?? true,
        wishlist_enabled: data.wishlist_enabled ?? true,
        reviews_enabled: data.reviews_enabled ?? true,
        newsletter_enabled: data.newsletter_enabled ?? true,
      })
      // Charger la configuration du catalogue si disponible
      if (data.catalog_settings) {
        setCatalogConfig({
          viewers_count_enabled: data.catalog_settings.viewers_count_enabled ?? true,
          sort_options: data.catalog_settings.sort_options ?? ['name', 'newest', 'price_asc', 'price_desc', 'popular'],
          pagination_options: data.catalog_settings.pagination_options ?? [12, 24, 36, 48],
        })
      }
      // Charger les informations de contact
      setContactConfig({
        whatsapp_number: data.whatsapp_number ?? '+21600000000',
        contact_email: data.contact_email ?? 'contact@quelyos.com',
        contact_phone: data.contact_phone ?? '+21600000000',
      })
      // Charger la configuration livraison
      setShippingConfig({
        shipping_standard_days: data.shipping_standard_days ?? '2-5',
        shipping_express_days: data.shipping_express_days ?? '1-2',
        free_shipping_threshold: data.free_shipping_threshold ?? 150,
      })
      // Charger la configuration retours
      setReturnsConfig({
        return_delay_days: data.return_delay_days ?? 30,
        refund_delay_days: data.refund_delay_days ?? '7-10',
      })
      // Charger la garantie
      setWarrantyConfig({
        warranty_years: data.warranty_years ?? 2,
      })
      // Charger les modes de paiement
      if (data.payment_methods) {
        setPaymentMethods(data.payment_methods)
      }
    }
  }, [data])

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        ...features,
        ...contactConfig,
        ...shippingConfig,
        ...returnsConfig,
        ...warrantyConfig,
        payment_methods: paymentMethods,
        catalog_settings: catalogConfig,
      })
      toast.success('Configuration mise à jour avec succès')
    } catch {
      toast.error('Erreur lors de la mise à jour de la configuration')
    }
  }

  const togglePaymentMethod = (method: string) => {
    setPaymentMethods(prev =>
      prev.includes(method)
        ? prev.filter(m => m !== method)
        : [...prev, method]
    )
  }

  const toggleSortOption = (option: string) => {
    setCatalogConfig(prev => ({
      ...prev,
      sort_options: prev.sort_options.includes(option)
        ? prev.sort_options.filter(o => o !== option)
        : [...prev.sort_options, option]
    }))
  }

  const togglePaginationOption = (option: number) => {
    setCatalogConfig(prev => ({
      ...prev,
      pagination_options: prev.pagination_options.includes(option)
        ? prev.pagination_options.filter(o => o !== option)
        : [...prev.pagination_options, option].sort((a, b) => a - b)
    }))
  }

  const toggleFeature = (key: keyof typeof features) => {
    setFeatures((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="p-8">
          <Skeleton className="h-10 w-64 mb-8" />
          <div className="grid gap-6">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="p-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">
              Erreur lors du chargement de la configuration
            </p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-8">
        <Breadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/dashboard' },
            { label: 'Configuration du site' },
          ]}
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Configuration du site
          </h1>
          <p className="text-gray-700 dark:text-gray-300 mt-2">
            Activez ou désactivez les fonctionnalités du site e-commerce
          </p>
        </div>

        {/* Section Fonctionnalités */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Fonctionnalités actives
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Gérez les fonctionnalités disponibles sur votre boutique en ligne
              </p>
            </div>
            <Button
              variant="primary"
              onClick={handleSave}
              loading={updateMutation.isPending}
            >
              Enregistrer
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                key: 'compare_enabled' as const,
                label: 'Comparateur de produits',
                description: 'Permet aux clients de comparer plusieurs produits côte à côte',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ),
              },
              {
                key: 'wishlist_enabled' as const,
                label: 'Liste de souhaits',
                description: 'Permet aux clients de sauvegarder leurs produits favoris',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                ),
              },
              {
                key: 'reviews_enabled' as const,
                label: 'Avis clients',
                description: 'Permet aux clients de laisser des avis sur les produits',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                ),
              },
              {
                key: 'newsletter_enabled' as const,
                label: 'Newsletter',
                description: 'Affiche le popup de capture d\'emails pour la newsletter',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                ),
              },
            ].map((feature) => (
              <label
                key={feature.key}
                className={`
                  flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all
                  ${features[feature.key]
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                <input
                  type="checkbox"
                  checked={features[feature.key]}
                  onChange={() => toggleFeature(feature.key)}
                  className="mt-1 w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-600">{feature.icon}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{feature.label}</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{feature.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Section Configuration Catalogue */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mt-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Configuration du catalogue
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Personnalisez l'affichage et les options de la page produits
            </p>
          </div>

          {/* Preuve sociale (ViewersCount) */}
          <div className="mb-6">
            <label
              className={`
                flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all
                ${catalogConfig.viewers_count_enabled
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
            >
              <input
                type="checkbox"
                checked={catalogConfig.viewers_count_enabled}
                onChange={() => setCatalogConfig(prev => ({ ...prev, viewers_count_enabled: !prev.viewers_count_enabled }))}
                className="mt-1 w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="font-medium text-gray-900 dark:text-white">Preuve sociale (ViewersCount)</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Affiche "X personnes regardent ce produit" pour créer un sentiment d'urgence
                </p>
              </div>
            </label>
          </div>

          {/* Options de tri */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Options de tri disponibles
            </h3>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'name', label: 'Nom (A-Z)' },
                { key: 'newest', label: 'Nouveautés' },
                { key: 'price_asc', label: 'Prix croissant' },
                { key: 'price_desc', label: 'Prix décroissant' },
                { key: 'popular', label: 'Popularité' },
              ].map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => toggleSortOption(option.key)}
                  className={`
                    px-3 py-2 rounded-lg text-sm font-medium transition-all
                    ${catalogConfig.sort_options.includes(option.key)
                      ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-2 border-indigo-500'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-2 border-transparent hover:bg-gray-200 dark:hover:bg-gray-600'
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Sélectionnez les options de tri à afficher sur la page catalogue
            </p>
          </div>

          {/* Options de pagination */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Produits par page
            </h3>
            <div className="flex flex-wrap gap-2">
              {[12, 24, 36, 48, 60].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => togglePaginationOption(option)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${catalogConfig.pagination_options.includes(option)
                      ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-2 border-indigo-500'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-2 border-transparent hover:bg-gray-200 dark:hover:bg-gray-600'
                    }
                  `}
                >
                  {option}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Sélectionnez les options de pagination disponibles pour les clients
            </p>
          </div>
        </div>

        {/* Section Contact */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mt-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Informations de contact
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Coordonnées affichées sur la boutique en ligne
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                WhatsApp
              </label>
              <input
                type="text"
                value={contactConfig.whatsapp_number}
                onChange={(e) => setContactConfig(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="+21600000000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={contactConfig.contact_email}
                onChange={(e) => setContactConfig(prev => ({ ...prev, contact_email: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="contact@quelyos.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Téléphone
              </label>
              <input
                type="text"
                value={contactConfig.contact_phone}
                onChange={(e) => setContactConfig(prev => ({ ...prev, contact_phone: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="+21600000000"
              />
            </div>
          </div>
        </div>

        {/* Section Livraison */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mt-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              Configuration livraison
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Délais et conditions de livraison affichés aux clients
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Délai standard (jours)
              </label>
              <input
                type="text"
                value={shippingConfig.shipping_standard_days}
                onChange={(e) => setShippingConfig(prev => ({ ...prev, shipping_standard_days: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="2-5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Délai express (jours)
              </label>
              <input
                type="text"
                value={shippingConfig.shipping_express_days}
                onChange={(e) => setShippingConfig(prev => ({ ...prev, shipping_express_days: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="1-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Seuil livraison gratuite (DT)
              </label>
              <input
                type="number"
                value={shippingConfig.free_shipping_threshold}
                onChange={(e) => setShippingConfig(prev => ({ ...prev, free_shipping_threshold: Number(e.target.value) }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="150"
              />
            </div>
          </div>
        </div>

        {/* Section Retours & Garantie */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mt-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Retours & Garantie
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Politique de retours et garantie affichée aux clients
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Délai de retour (jours)
              </label>
              <input
                type="number"
                value={returnsConfig.return_delay_days}
                onChange={(e) => setReturnsConfig(prev => ({ ...prev, return_delay_days: Number(e.target.value) }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Délai de remboursement (jours)
              </label>
              <input
                type="text"
                value={returnsConfig.refund_delay_days}
                onChange={(e) => setReturnsConfig(prev => ({ ...prev, refund_delay_days: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="7-10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Durée garantie (années)
              </label>
              <input
                type="number"
                value={warrantyConfig.warranty_years}
                onChange={(e) => setWarrantyConfig(prev => ({ ...prev, warranty_years: Number(e.target.value) }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="2"
              />
            </div>
          </div>
        </div>

        {/* Section Modes de paiement */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mt-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Modes de paiement acceptés
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Modes de paiement affichés sur la fiche produit
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { key: 'card', label: 'Carte bancaire' },
              { key: 'cash', label: 'Espèces' },
              { key: 'transfer', label: 'Virement' },
              { key: 'mobile', label: 'Mobile money' },
            ].map((method) => (
              <button
                key={method.key}
                type="button"
                onClick={() => togglePaymentMethod(method.key)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${paymentMethods.includes(method.key)
                    ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-2 border-indigo-500'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-2 border-transparent hover:bg-gray-200 dark:hover:bg-gray-600'
                  }
                `}
              >
                {method.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}

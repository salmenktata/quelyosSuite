import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { useProduct, useCreateProduct, useUpdateProduct, useTaxes, useUom, useProductTypes, useProductTags, useCreateProductTag } from '../hooks/useProducts'
import { useCategories } from '../hooks/useCategories'
import {
  Button,
  Input,
  Breadcrumbs,
  Skeleton,
  ImageGallery,
  VariantManager,
  Badge,
} from '../components/common'
import { useToast } from '../hooks/useToast'
import { ToastContainer } from '../components/common/Toast'
import {
  useProductImages,
  useUploadProductImages,
  useDeleteProductImage,
  useReorderProductImages,
} from '../hooks/useProductImages'
import { api } from '../lib/api'

export default function ProductForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditing = !!id
  const productId = isEditing ? Number(id) : undefined

  const toast = useToast()

  const { data: productData, isLoading: isLoadingProduct } = useProduct(Number(id))
  const { data: categoriesData } = useCategories()
  const { data: taxesData } = useTaxes()
  const { data: uomData } = useUom()
  const { data: productTypesData } = useProductTypes()
  const { data: productTagsData } = useProductTags()
  const createTagMutation = useCreateProductTag()
  const createProductMutation = useCreateProduct()
  const updateProductMutation = useUpdateProduct()

  // Images (uniquement en mode édition)
  const { data: imagesData } = useProductImages(productId)
  const uploadImagesMutation = useUploadProductImages(productId)
  const deleteImageMutation = useDeleteProductImage(productId)
  const reorderImagesMutation = useReorderProductImages(productId)

  // État pour le stock
  const [stockQty, setStockQty] = useState<number | null>(null)
  const [updatingStock, setUpdatingStock] = useState(false)

  // État pour les taxes sélectionnées
  const [selectedTaxIds, setSelectedTaxIds] = useState<number[]>([])

  // État pour les tags sélectionnés
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
  const [newTagName, setNewTagName] = useState('')

  // Onglet actif
  const [activeTab, setActiveTab] = useState<'general' | 'variants' | 'stock'>('general')

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    standard_price: '',
    default_code: '',
    barcode: '',
    weight: '',
    volume: '',
    product_length: '',
    product_width: '',
    product_height: '',
    description: '',
    description_purchase: '',
    category_id: '',
    detailed_type: 'consu' as 'consu' | 'service' | 'product',
    uom_id: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const categories = categoriesData?.data?.categories || []
  const taxes = taxesData?.data?.taxes || []
  const uomList = uomData?.data?.uom || []
  const productTypes = productTypesData?.data?.product_types || []
  const productTags = productTagsData?.data?.tags || []

  // Charger les données du produit en mode édition
  useEffect(() => {
    if (isEditing && productData?.data?.product) {
      const product = productData.data.product
      setFormData({
        name: product.name || '',
        price: product.price?.toString() || '',
        standard_price: product.standard_price?.toString() || '',
        default_code: product.default_code || '',
        barcode: product.barcode || '',
        weight: product.weight?.toString() || '',
        volume: product.volume?.toString() || '',
        product_length: product.product_length?.toString() || '',
        product_width: product.product_width?.toString() || '',
        product_height: product.product_height?.toString() || '',
        description: product.description || '',
        description_purchase: product.description_purchase || '',
        category_id: product.category?.id?.toString() || '',
        detailed_type: product.detailed_type || 'consu',
        uom_id: product.uom_id?.toString() || '',
      })
      setStockQty(product.qty_available ?? null)
      // Charger les taxes du produit
      if (product.taxes) {
        setSelectedTaxIds(product.taxes.map((t: { id: number }) => t.id))
      }
      // Charger les tags du produit
      if (product.product_tag_ids) {
        setSelectedTagIds(product.product_tag_ids.map((t: { id: number }) => t.id))
      }
    }
  }, [isEditing, productData])

  // Validation d'un champ individuel (temps réel)
  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Le nom est obligatoire'
        if (value.trim().length < 2) return 'Le nom doit contenir au moins 2 caractères'
        return ''
      case 'price':
        if (!value) return 'Le prix est obligatoire'
        if (isNaN(Number(value)) || Number(value) < 0) return 'Le prix doit être un nombre positif'
        return ''
      case 'standard_price':
        if (value && (isNaN(Number(value)) || Number(value) < 0)) return 'Le prix d\'achat doit être un nombre positif'
        return ''
      case 'weight':
        if (value && (isNaN(Number(value)) || Number(value) < 0)) return 'Le poids doit être un nombre positif'
        return ''
      case 'barcode':
        if (value && !/^\d{8,14}$/.test(value)) return 'Le code-barres doit contenir 8 à 14 chiffres'
        return ''
      default:
        return ''
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    const fieldsToValidate = ['name', 'price', 'standard_price', 'weight', 'barcode']

    fieldsToValidate.forEach((field) => {
      const error = validateField(field, formData[field as keyof typeof formData] as string)
      if (error) newErrors[field] = error
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Marquer tous les champs comme touchés
    setTouched({ name: true, price: true, description: true, category_id: true })

    if (!validate()) {
      toast.error('Veuillez corriger les erreurs du formulaire')
      return
    }

    const data = {
      name: formData.name,
      price: Number(formData.price),
      description: formData.description || undefined,
      description_purchase: formData.description_purchase || undefined,
      category_id: formData.category_id ? Number(formData.category_id) : undefined,
      default_code: formData.default_code || undefined,
      barcode: formData.barcode || undefined,
      standard_price: formData.standard_price ? Number(formData.standard_price) : undefined,
      weight: formData.weight ? Number(formData.weight) : undefined,
      volume: formData.volume ? Number(formData.volume) : undefined,
      product_length: formData.product_length ? Number(formData.product_length) : undefined,
      product_width: formData.product_width ? Number(formData.product_width) : undefined,
      product_height: formData.product_height ? Number(formData.product_height) : undefined,
      detailed_type: formData.detailed_type,
      uom_id: formData.uom_id ? Number(formData.uom_id) : undefined,
      taxes_id: selectedTaxIds.length > 0 ? selectedTaxIds : [],
      product_tag_ids: selectedTagIds.length > 0 ? selectedTagIds : [],
    }

    try {
      if (isEditing) {
        await updateProductMutation.mutateAsync({ id: Number(id), data })
        toast.success(`Le produit "${formData.name}" a été modifié avec succès`)
      } else {
        const result = await createProductMutation.mutateAsync(data)
        toast.success(`Le produit "${formData.name}" a été créé avec succès`)
        // Rediriger vers l'édition pour permettre d'ajouter images et variantes
        if (result.data?.product?.id) {
          navigate(`/products/${result.data.product.id}/edit`)
          return
        }
      }
      navigate('/products')
    } catch (error) {
      toast.error(`Erreur lors de ${isEditing ? 'la modification' : 'la création'} du produit`)
      console.error('Error saving product:', error)
    }
  }

  // Mise à jour du stock
  const handleUpdateStock = async (newQty: number) => {
    if (!productId) return

    setUpdatingStock(true)
    try {
      await api.updateProductStock(productId, newQty)
      setStockQty(newQty)
      toast.success('Stock mis à jour avec succès')
    } catch {
      toast.error('Erreur lors de la mise à jour du stock')
    } finally {
      setUpdatingStock(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Marquer comme touché lors de la première modification
    if (!touched[name]) {
      setTouched((prev) => ({ ...prev, [name]: true }))
    }

    // Validation temps réel (immédiate)
    const error = validateField(name, value)
    setErrors((prev) => ({ ...prev, [name]: error }))
  }

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    // Revalider à la perte de focus
    const error = validateField(field, formData[field as keyof typeof formData] as string)
    setErrors((prev) => ({ ...prev, [field]: error }))
  }

  if (isEditing && isLoadingProduct) {
    return (
      <Layout>
        <div className="p-8">
          <Breadcrumbs
            items={[
              { label: 'Tableau de bord', href: '/dashboard' },
              { label: 'Produits', href: '/products' },
              { label: 'Chargement...' },
            ]}
          />
          <div className="space-y-4 mt-8">
            <Skeleton variant="text" width="40%" height={36} />
            <Skeleton variant="text" width="60%" height={20} />
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-6 mt-8">
              <Skeleton count={4} height={80} />
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-8">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/dashboard' },
            { label: 'Produits', href: '/products' },
            { label: isEditing ? 'Modifier' : 'Nouveau produit' },
          ]}
        />

        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {isEditing ? 'Modifier le produit' : 'Nouveau produit'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {isEditing ? 'Modifier les informations du produit' : 'Créer un nouveau produit dans le catalogue'}
          </p>
        </div>

        {/* Onglets (en mode édition) avec animation */}
        {isEditing && (
          <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8 relative">
              {/* Indicateur animé */}
              <div
                className="absolute bottom-0 h-0.5 bg-indigo-500 transition-all duration-300 ease-out"
                style={{
                  left: activeTab === 'general' ? '0%' : activeTab === 'variants' ? '33.33%' : '66.66%',
                  width: activeTab === 'general' ? '160px' : activeTab === 'variants' ? '90px' : '50px',
                }}
              />
              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className={`py-2 px-1 font-medium text-sm transition-all duration-200 ${
                  activeTab === 'general'
                    ? 'text-indigo-600 dark:text-indigo-400 scale-105'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Informations générales
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('variants')}
                className={`py-2 px-1 font-medium text-sm transition-all duration-200 ${
                  activeTab === 'variants'
                    ? 'text-indigo-600 dark:text-indigo-400 scale-105'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Variantes
                {productData?.data?.product?.variant_count && productData.data.product.variant_count > 1 && (
                  <Badge variant="info" className="ml-2">
                    {productData.data.product.variant_count}
                  </Badge>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('stock')}
                className={`py-2 px-1 font-medium text-sm transition-all duration-200 ${
                  activeTab === 'stock'
                    ? 'text-indigo-600 dark:text-indigo-400 scale-105'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Stock
              </button>
            </nav>
          </div>
        )}

        {/* Contenu */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 transition-all duration-300">
          {/* Onglet Général */}
          {(activeTab === 'general' || !isEditing) && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informations de base */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nom */}
                <div className="md:col-span-2">
                  <Input
                    label="Nom du produit"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={() => handleBlur('name')}
                    error={touched.name ? errors.name : undefined}
                    success={touched.name && !errors.name && formData.name.length >= 2}
                    required
                    placeholder="Ex: T-shirt Nike Air"
                  />
                </div>

                {/* Prix de vente */}
                <Input
                  label="Prix de vente (€)"
                  type="number"
                  step="0.01"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  onBlur={() => handleBlur('price')}
                  error={touched.price ? errors.price : undefined}
                  success={touched.price && !errors.price && Number(formData.price) > 0}
                  required
                  placeholder="49.99"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  }
                />

                {/* Prix d'achat */}
                <Input
                  label="Prix d'achat (€)"
                  type="number"
                  step="0.01"
                  id="standard_price"
                  name="standard_price"
                  value={formData.standard_price}
                  onChange={handleChange}
                  onBlur={() => handleBlur('standard_price')}
                  error={touched.standard_price ? errors.standard_price : undefined}
                  placeholder="25.00"
                />

                {/* Catégorie */}
                <div>
                  <label
                    htmlFor="category_id"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Catégorie
                  </label>
                  <select
                    id="category_id"
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent outline-none transition-all"
                  >
                    <option value="">Sans catégorie</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Référence SKU */}
                <Input
                  label="Référence (SKU)"
                  id="default_code"
                  name="default_code"
                  value={formData.default_code}
                  onChange={handleChange}
                  placeholder="PROD-001"
                />

                {/* Code-barres */}
                <Input
                  label="Code-barres (EAN13)"
                  id="barcode"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  placeholder="3760012345678"
                />

                {/* Poids */}
                <Input
                  label="Poids (kg)"
                  type="number"
                  step="0.001"
                  id="weight"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  onBlur={() => handleBlur('weight')}
                  error={touched.weight ? errors.weight : undefined}
                  placeholder="0.5"
                />

                {/* Volume */}
                <Input
                  label="Volume (m³)"
                  type="number"
                  step="0.001"
                  id="volume"
                  name="volume"
                  value={formData.volume}
                  onChange={handleChange}
                  placeholder="0.001"
                />

                {/* Dimensions */}
                <div className="col-span-full">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Dimensions (cm)
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      label="Longueur"
                      type="number"
                      step="0.1"
                      id="product_length"
                      name="product_length"
                      value={formData.product_length}
                      onChange={handleChange}
                      placeholder="30"
                    />
                    <Input
                      label="Largeur"
                      type="number"
                      step="0.1"
                      id="product_width"
                      name="product_width"
                      value={formData.product_width}
                      onChange={handleChange}
                      placeholder="20"
                    />
                    <Input
                      label="Hauteur"
                      type="number"
                      step="0.1"
                      id="product_height"
                      name="product_height"
                      value={formData.product_height}
                      onChange={handleChange}
                      placeholder="10"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Utilisées pour le calcul des frais de livraison
                  </p>
                </div>

                {/* Type de produit */}
                <div>
                  <label
                    htmlFor="detailed_type"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Type de produit
                  </label>
                  <select
                    id="detailed_type"
                    name="detailed_type"
                    value={formData.detailed_type}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        detailed_type: e.target.value as 'consu' | 'service' | 'product',
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {productTypes.map((type: { value: string; label: string; description: string }) => (
                      <option key={type.value} value={type.value}>
                        {type.label} - {type.description}
                      </option>
                    ))}
                    {productTypes.length === 0 && (
                      <>
                        <option value="consu">Consommable - Pas de gestion de stock</option>
                        <option value="service">Service - Prestation immatérielle</option>
                        <option value="product">Stockable - Avec gestion de stock</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Unité de mesure */}
                <div>
                  <label
                    htmlFor="uom_id"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Unité de mesure
                  </label>
                  <select
                    id="uom_id"
                    name="uom_id"
                    value={formData.uom_id}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        uom_id: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Unité par défaut</option>
                    {uomList.map((uom: { id: number; name: string; category_name: string }) => (
                      <option key={uom.id} value={uom.id}>
                        {uom.name} ({uom.category_name})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Taxes de vente */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Taxes de vente
                  </label>
                  <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                    {taxes.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Aucune taxe disponible
                      </p>
                    ) : (
                      taxes.map((tax) => (
                        <label
                          key={tax.id}
                          className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-1 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={selectedTaxIds.includes(tax.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTaxIds((prev) => [...prev, tax.id])
                              } else {
                                setSelectedTaxIds((prev) => prev.filter((id) => id !== tax.id))
                              }
                            }}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {tax.name}
                            <span className="text-gray-500 dark:text-gray-400 ml-1">
                              ({tax.amount_type === 'percent' ? `${tax.amount}%` : `${tax.amount} €`}
                              {tax.price_include && ' TTC'})
                            </span>
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                  {selectedTaxIds.length > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {selectedTaxIds.length} taxe{selectedTaxIds.length > 1 ? 's' : ''} sélectionnée{selectedTaxIds.length > 1 ? 's' : ''}
                    </p>
                  )}
                </div>

                {/* Tags produit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tags
                  </label>
                  {/* Tags sélectionnés */}
                  {selectedTagIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {selectedTagIds.map((tagId) => {
                        const tag = productTags.find((t: { id: number }) => t.id === tagId)
                        return tag ? (
                          <Badge
                            key={tagId}
                            variant="info"
                            className="flex items-center gap-1"
                          >
                            {tag.name}
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedTagIds((prev) => prev.filter((id) => id !== tagId))
                              }
                              className="ml-1 hover:text-red-500"
                            >
                              ×
                            </button>
                          </Badge>
                        ) : null
                      })}
                    </div>
                  )}
                  {/* Sélecteur de tags */}
                  <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 space-y-2 max-h-32 overflow-y-auto">
                    {productTags.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Aucun tag disponible
                      </p>
                    ) : (
                      productTags
                        .filter((tag: { id: number }) => !selectedTagIds.includes(tag.id))
                        .map((tag: { id: number; name: string; color: number }) => (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => setSelectedTagIds((prev) => [...prev, tag.id])}
                            className="block w-full text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 p-1 rounded"
                          >
                            + {tag.name}
                          </button>
                        ))
                    )}
                  </div>
                  {/* Créer un nouveau tag */}
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="Nouveau tag..."
                      className="flex-1 px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={!newTagName.trim() || createTagMutation.isPending}
                      loading={createTagMutation.isPending}
                      onClick={async () => {
                        if (!newTagName.trim()) return
                        try {
                          const result = await createTagMutation.mutateAsync({
                            name: newTagName.trim(),
                          })
                          const newTag = result.data
                          if (result.success && newTag) {
                            setSelectedTagIds((prev) => [...prev, newTag.id])
                            setNewTagName('')
                            toast.success('Tag créé')
                          }
                        } catch {
                          toast.error('Erreur lors de la création du tag')
                        }
                      }}
                    >
                      Créer
                    </Button>
                  </div>
                </div>
              </div>

              {/* Description vente */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Description (vente)
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent outline-none transition-all"
                  placeholder="Description visible par le client..."
                />
              </div>

              {/* Description achat */}
              <div>
                <label
                  htmlFor="description_purchase"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Description (achat/fournisseur)
                </label>
                <textarea
                  id="description_purchase"
                  name="description_purchase"
                  value={formData.description_purchase}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent outline-none transition-all"
                  placeholder="Notes internes pour les commandes fournisseurs..."
                />
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Images du produit
                </label>
                {isEditing ? (
                  <ImageGallery
                    images={imagesData || []}
                    onUpload={async (images) => {
                      try {
                        await uploadImagesMutation.mutateAsync(images)
                        toast.success('Images uploadées avec succès')
                      } catch {
                        toast.error('Erreur lors de l\'upload des images')
                      }
                    }}
                    onDelete={async (imageId) => {
                      try {
                        await deleteImageMutation.mutateAsync(imageId)
                        toast.success('Image supprimée avec succès')
                      } catch {
                        toast.error('Erreur lors de la suppression de l\'image')
                      }
                    }}
                    onReorder={async (imageIds) => {
                      try {
                        await reorderImagesMutation.mutateAsync(imageIds)
                      } catch {
                        toast.error('Erreur lors de la réorganisation des images')
                      }
                    }}
                    maxImages={10}
                    disabled={updateProductMutation.isPending}
                  />
                ) : (
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                    <svg
                      className="w-12 h-12 mx-auto text-gray-400 mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Créez d'abord le produit pour ajouter des images
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate('/products')}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={createProductMutation.isPending || updateProductMutation.isPending}
                  disabled={createProductMutation.isPending || updateProductMutation.isPending}
                >
                  {isEditing ? 'Modifier' : 'Créer'}
                </Button>
              </div>
            </form>
          )}

          {/* Onglet Variantes (seulement en édition) */}
          {isEditing && activeTab === 'variants' && productId && (
            <VariantManager
              productId={productId}
              disabled={updateProductMutation.isPending}
              onSuccess={(message) => toast.success(message)}
              onError={(error) => toast.error(error)}
            />
          )}

          {/* Onglet Stock (seulement en édition) */}
          {isEditing && activeTab === 'stock' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Gestion du stock
                </h3>

                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Stock actuel */}
                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Stock disponible</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {stockQty ?? '—'}
                      </p>
                    </div>

                    {/* Statut */}
                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Statut</p>
                      <div className="mt-1">
                        {stockQty === null ? (
                          <Badge variant="neutral">Non défini</Badge>
                        ) : stockQty <= 0 ? (
                          <Badge variant="error">Rupture de stock</Badge>
                        ) : stockQty <= 5 ? (
                          <Badge variant="warning">Stock faible</Badge>
                        ) : (
                          <Badge variant="success">En stock</Badge>
                        )}
                      </div>
                    </div>

                    {/* Modifier stock */}
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 text-center">
                        Ajuster le stock
                      </p>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={stockQty?.toString() || ''}
                          onChange={(e) => setStockQty(e.target.value ? Number(e.target.value) : null)}
                          placeholder="Quantité"
                        />
                        <Button
                          variant="primary"
                          onClick={() => stockQty !== null && handleUpdateStock(stockQty)}
                          loading={updatingStock}
                          disabled={stockQty === null || updatingStock}
                        >
                          Mettre à jour
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex">
                  <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Note importante
                    </h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      Si le produit possède des variantes, le stock affiché ici est le stock global.
                      Pour gérer le stock par variante, utilisez l'onglet "Variantes".
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} position="top-right" />
      </div>
    </Layout>
  )
}

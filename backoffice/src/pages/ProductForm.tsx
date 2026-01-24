import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { useProduct, useCreateProduct, useUpdateProduct } from '../hooks/useProducts'
import { useCategories } from '../hooks/useCategories'
import { Button, Input, Breadcrumbs, Skeleton } from '../components/common'
import { useToast } from '../hooks/useToast'
import { ToastContainer } from '../components/common/Toast'

export default function ProductForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditing = !!id

  const toast = useToast()

  const { data: productData, isLoading: isLoadingProduct } = useProduct(Number(id))
  const { data: categoriesData } = useCategories()
  const createProductMutation = useCreateProduct()
  const updateProductMutation = useUpdateProduct()

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    category_id: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const categories = categoriesData?.data?.categories || []

  // Charger les données du produit en mode édition
  useEffect(() => {
    if (isEditing && productData?.data?.product) {
      const product = productData.data.product
      setFormData({
        name: product.name || '',
        price: product.price?.toString() || '',
        description: product.description || '',
        category_id: product.category?.id?.toString() || '',
      })
    }
  }, [isEditing, productData])

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est obligatoire'
    }

    if (!formData.price) {
      newErrors.price = 'Le prix est obligatoire'
    } else if (isNaN(Number(formData.price)) || Number(formData.price) < 0) {
      newErrors.price = 'Le prix doit être un nombre positif'
    }

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
      category_id: formData.category_id ? Number(formData.category_id) : undefined,
    }

    try {
      if (isEditing) {
        await updateProductMutation.mutateAsync({ id: Number(id), data })
        toast.success(`Le produit "${formData.name}" a été modifié avec succès`)
      } else {
        await createProductMutation.mutateAsync(data)
        toast.success(`Le produit "${formData.name}" a été créé avec succès`)
      }
      navigate('/products')
    } catch (error) {
      toast.error(`Erreur lors de ${isEditing ? 'la modification' : 'la création'} du produit`)
      console.error('Error saving product:', error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Effacer l'erreur du champ modifié
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    validate()
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

        {/* Formulaire */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nom */}
            <Input
              label="Nom du produit"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onBlur={() => handleBlur('name')}
              error={touched.name ? errors.name : undefined}
              required
              placeholder="Ex: T-shirt Nike Air"
            />

            {/* Prix */}
            <Input
              label="Prix (€)"
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              onBlur={() => handleBlur('price')}
              error={touched.price ? errors.price : undefined}
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

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent outline-none transition-all"
                placeholder="Description du produit..."
              />
            </div>

            {/* Image (placeholder pour le moment) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Image du produit
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center transition-colors hover:border-indigo-400">
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
                  Upload d'images disponible prochainement
                </p>
              </div>
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
        </div>

        {/* ToastContainer */}
        <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} position="top-right" />
      </div>
    </Layout>
  )
}

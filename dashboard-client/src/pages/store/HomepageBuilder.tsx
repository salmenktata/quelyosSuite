/**
 * Homepage Builder - Gestionnaire ordre sections homepage e-commerce
 *
 * Fonctionnalités :
 * - Drag & drop sections homepage (@dnd-kit)
 * - Toggle visibilité sections
 * - Preview ordre temps réel
 * - Sauvegarde configuration tenant
 * - Liens directs vers édition sections
 *
 * @module store/homepage-builder
 */

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, Button, Badge } from '@/components/common'
import { GripVertical, Eye, EyeOff, ExternalLink, Save, AlertCircle, RefreshCw } from 'lucide-react'
import { api } from '@/lib/api'
import { useNavigate } from 'react-router-dom'

interface Section {
  id: string
  name: string
  description: string
  visible: boolean
  icon: string
  route: string
}

interface HomepageConfig {
  id: number
  sections_order: Section[]
}

interface ConfigResponse {
  success: boolean
  config: HomepageConfig
}

interface SortableItemProps {
  section: Section
  onToggleVisibility: (id: string) => void
  onNavigate: (route: string) => void
}

function SortableItem({ section, onToggleVisibility, onNavigate }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: section.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 mb-3"
    >
      {/* Drag Handle */}
      <button
        className="cursor-grab active:cursor-grabbing p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5 text-gray-400" />
      </button>

      {/* Section Info */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-lg">{section.icon}</span>
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              {section.name}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {section.description}
            </p>
          </div>
        </div>
      </div>

      {/* Visibility Badge */}
      <Badge className={section.visible
        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200'
      }>
        {section.visible ? 'Visible' : 'Masquée'}
      </Badge>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onToggleVisibility(section.id)}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          title={section.visible ? 'Masquer' : 'Afficher'}
        >
          {section.visible ? (
            <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          ) : (
            <EyeOff className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          )}
        </button>
        <button
          onClick={() => onNavigate(section.route)}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Éditer cette section"
        >
          <ExternalLink className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
        </button>
      </div>
    </div>
  )
}

export default function HomepageBuilder() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [sections, setSections] = useState<Section[]>([])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  const { data, isLoading, error, refetch } = useQuery<ConfigResponse>({
    queryKey: ['homepage-sections'],
    queryFn: async () => {
      const response = await api.post('/api/admin/homepage-builder/config', {})
      return response.data as ConfigResponse
    }
  })

  // Sync sections avec data
  useEffect(() => {
    if (data?.success && data?.config?.sections_order) {
      setSections(data.config.sections_order)
    }
  }, [data])

  const saveMutation = useMutation({
    mutationFn: async (updatedSections: Section[]) => {
      const response = await api.post('/api/admin/homepage-builder/config/save', {
        sections_order: updatedSections
      })
      return response.data as { success: boolean; message?: string }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homepage-sections'] })
    }
  })

  const resetMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/api/admin/homepage-builder/config/reset', {})
      return response.data as ConfigResponse
    },
    onSuccess: (resetData) => {
      if (resetData?.success && resetData?.config?.sections_order) {
        setSections(resetData.config.sections_order)
      }
      queryClient.invalidateQueries({ queryKey: ['homepage-sections'] })
    }
  })

  const handleReset = () => {
    if (window.confirm("Voulez-vous vraiment réinitialiser la configuration à l'ordre par défaut ?")) {
      resetMutation.mutate()
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id)
        const newIndex = items.findIndex((i) => i.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const handleToggleVisibility = (id: string) => {
    setSections((items) =>
      items.map((item) =>
        item.id === id ? { ...item, visible: !item.visible } : item
      )
    )
  }

  const handleSave = () => {
    saveMutation.mutate(sections)
  }

  const breadcrumbItems = [
    { label: 'Tableau de bord', path: '/store' },
    { label: 'Homepage Builder' }
  ]

  return (
    <Layout>
      <Breadcrumbs items={breadcrumbItems} />

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestionnaire Homepage
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Organisez l'ordre et la visibilité des sections de votre homepage e-commerce
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saveMutation.isPending}
        >
          <Save className="h-4 w-4" />
          {saveMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
      </div>

      {/* Notice */}
      <div className="mb-6 rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          💡 <strong>Drag & drop</strong> pour réorganiser • <strong>Icône œil</strong> pour masquer/afficher • <strong>Icône lien</strong> pour éditer
        </p>
      </div>

      {/* Success Message */}
      {saveMutation.isSuccess && (
        <div className="mb-6 rounded-lg bg-green-50 dark:bg-green-900/20 p-4">
          <p className="text-sm text-green-800 dark:text-green-200">
            ✓ Configuration sauvegardée avec succès !
          </p>
        </div>
      )}

      {/* Error Message */}
      {saveMutation.isError && (
        <div className="mb-6 rounded-lg bg-red-50 dark:bg-red-900/20 p-4">
          <p className="text-sm text-red-800 dark:text-red-200">
            Erreur lors de la sauvegarde
          </p>
        </div>
      )}

      {/* Sections List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Chargement...</p>
        </div>
      ) : (
        <div className="max-w-3xl">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sections.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              {sections.map((section) => (
                <SortableItem
                  key={section.id}
                  section={section}
                  onToggleVisibility={handleToggleVisibility}
                  onNavigate={(link) => navigate(link)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-8 rounded-lg bg-gray-50 dark:bg-gray-900 p-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          Impact Client
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          L'ordre des sections définit l'apparence de votre homepage e-commerce. Les sections masquées
          ne s'affichent pas pour vos clients. Les modifications sont appliquées immédiatement après sauvegarde.
        </p>
      </div>
    </Layout>
  )
}

/**
 * Composant BannerTableRow - Ligne de tableau pour une bannière
 *
 * Affiche une ligne de tableau avec les informations d'une bannière et ses actions.
 */

import { Trash2 } from 'lucide-react'
import { Button } from '../../common'
import { PromoBanner } from '../../../hooks/usePromoBanners'

interface BannerTableRowProps {
  banner: PromoBanner
  isEditing: boolean
  onEdit: (banner: PromoBanner) => void
  onDelete: (id: number) => void
}

export function BannerTableRow({ banner, isEditing, onEdit, onDelete }: BannerTableRowProps) {
  return (
    <tr
      className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition ${
        isEditing ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
      }`}
      onClick={() => onEdit(banner)}
    >
      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
        {banner.name}
      </td>
      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
        {banner.title}
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            banner.active
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
          }`}
        >
          {banner.active ? 'Oui' : 'Non'}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <Button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(banner.id)
          }}
          size="sm"
          variant="danger"
          icon={<Trash2 className="h-3.5 w-3.5" />}
        >
          Supprimer
        </Button>
      </td>
    </tr>
  )
}

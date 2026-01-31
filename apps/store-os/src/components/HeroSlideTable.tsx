import { Button, SkeletonTable } from './common'
import { HeroSlide } from '../hooks/useHeroSlides'

interface HeroSlideTableProps {
  slides: HeroSlide[] | undefined
  isLoading: boolean
  editingSlideId: number | null
  onEdit: (slide: HeroSlide) => void
  onDelete: (id: number) => void
}

export function HeroSlideTable({ slides, isLoading, editingSlideId, onEdit, onDelete }: HeroSlideTableProps) {
  if (isLoading) {
    return <SkeletonTable rows={5} columns={3} />
  }

  return (
    <div className="overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nom</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Titre</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actif</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {slides?.map(s => (
            <tr
              key={s.id}
              className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${editingSlideId === s.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
              onClick={() => onEdit(s)}
            >
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white dark:text-gray-100">{s.name}</td>
              <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{s.title}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex px-2 py-1 text-xs rounded-full ${s.active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                  {s.active ? 'Oui' : 'Non'}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <Button onClick={(e) => { e.stopPropagation(); onDelete(s.id) }} size="sm" variant="secondary">Supprimer</Button>
              </td>
            </tr>
          ))}
          {(!slides || slides.length === 0) && (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                Aucun slide. Cliquez sur "Nouveau" pour en créer un.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

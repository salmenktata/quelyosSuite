/**
 * Calendrier des congés - Vue mensuelle des absences
 *
 * Fonctionnalités :
 * - Navigation par mois
 * - Filtrage par département
 * - Affichage des congés par jour avec couleur par type
 * - Légende dynamique des types de congés
 */
import { useState, useMemo } from 'react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice, SkeletonTable } from '@/components/common'
import { useMyTenant } from '@/hooks/useMyTenant'
import { useLeavesCalendar, useDepartments } from '@/hooks/hr'
import { hrNotices } from '@/lib/notices'
import { colorIndexToHex } from '@/lib/colorPalette'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function LeavesCalendarPage() {
  const { tenant } = useMyTenant()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [departmentFilter, setDepartmentFilter] = useState<number | undefined>()

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const startDate = new Date(year, month, 1).toISOString().split('T')[0]!
  const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0]!

  const { data: calendarData, isLoading } = useLeavesCalendar(
    tenant?.id || null,
    startDate,
    endDate,
    departmentFilter
  )

  const { data: departmentsData } = useDepartments(tenant?.id || null)
  const departments = departmentsData?.departments || []

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1

  const days = useMemo(() => {
    const result: Array<{ day: number | null; date: string | null }> = []
    for (let i = 0; i < adjustedFirstDay; i++) {
      result.push({ day: null, date: null })
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i).toISOString().split('T')[0]!
      result.push({ day: i, date })
    }
    return result
  }, [year, month, daysInMonth, adjustedFirstDay])

  const getLeavesForDay = (date: string | null) => {
    if (!date || !calendarData) return []
    return calendarData.filter(leave => {
      const from = leave.date_from?.split('T')[0]
      const to = leave.date_to?.split('T')[0]
      return from && to && date >= from && date <= to
    })
  }

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
  const today = new Date().toISOString().split('T')[0]!

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Accueil', href: '/' },
            { label: 'RH', href: '/hr' },
            { label: 'Congés', href: '/hr/leaves' },
            { label: 'Calendrier' },
          ]}
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Calendrier des absences
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Vue mensuelle des congés et absences
            </p>
          </div>
          <select
            value={departmentFilter || ''}
            onChange={(e) => setDepartmentFilter(e.target.value ? Number(e.target.value) : undefined)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
          >
            <option value="">Tous les départements</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        {/* PageNotice */}
        <PageNotice config={hrNotices.leavesCalendar} className="mb-2" />

        {/* Navigation mois */}
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white capitalize">
            {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Calendrier */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Jours de la semaine */}
          <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
              <div key={day} className="px-2 py-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                {day}
              </div>
            ))}
          </div>

          {/* Grille des jours */}
          {isLoading ? (
            <div className="p-4"><SkeletonTable rows={10} columns={7} /></div>
          ) : (
            <div className="grid grid-cols-7">
              {days.map((item, index) => {
                const leaves = getLeavesForDay(item.date)
                const isToday = item.date === today
                const isWeekend = (index % 7) >= 5

                return (
                  <div
                    key={index}
                    className={`min-h-[100px] p-2 border-b border-r border-gray-100 dark:border-gray-700 ${
                      !item.day ? 'bg-gray-50 dark:bg-gray-900/30' : ''
                    } ${isWeekend && item.day ? 'bg-gray-50/50 dark:bg-gray-900/20' : ''}`}
                  >
                    {item.day && (
                      <>
                        <div className={`text-sm font-medium mb-1 ${
                          isToday
                            ? 'w-7 h-7 flex items-center justify-center rounded-full bg-cyan-600 text-white'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {item.day}
                        </div>
                        <div className="space-y-1">
                          {leaves.slice(0, 3).map((leave, i) => {
                            const colorHex = colorIndexToHex((leave as { leave_type_color?: number | string }).leave_type_color)
                            return (
                              <div
                                key={i}
                                className="text-xs px-1 py-0.5 rounded truncate"
                                style={{
                                  backgroundColor: `${colorHex}20`,
                                  color: colorHex,
                                }}
                                title={`${leave.employee_name} - ${leave.leave_type_name || leave.leave_type}`}
                              >
                                {leave.employee_name.split(' ')[0]}
                              </div>
                            )
                          })}
                          {leaves.length > 3 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              +{leaves.length - 3} autres
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Légende */}
        {calendarData && calendarData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Légende
            </h3>
            <div className="flex flex-wrap gap-3">
              {Array.from(new Set(calendarData.map(l => l.leave_type_name || l.leave_type))).map(typeName => {
                const leave = calendarData.find(l => (l.leave_type_name || l.leave_type) === typeName)
                const colorHex = colorIndexToHex((leave as { leave_type_color?: number | string } | undefined)?.leave_type_color)
                return (
                  <div key={typeName} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: colorHex }}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{typeName}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

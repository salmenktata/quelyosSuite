/**
 * Date Utilities pour le module RH
 */

/**
 * Formater une date en français
 */
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Formater une date avec l'heure
 */
export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formater une heure (HH:MM)
 */
export function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Obtenir le début du jour
 */
export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Obtenir la fin du jour
 */
export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Obtenir le début de la semaine (lundi)
 */
export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
  const monday = new Date(d.setDate(diff));
  return startOfDay(monday);
}

/**
 * Obtenir la fin de la semaine (dimanche)
 */
export function endOfWeek(date: Date): Date {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return endOfDay(end);
}

/**
 * Obtenir le début du mois
 */
export function startOfMonth(date: Date): Date {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/**
 * Obtenir la fin du mois
 */
export function endOfMonth(date: Date): Date {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

/**
 * Calculer la différence en jours entre deux dates
 */
export function daysBetween(start: Date | string, end: Date | string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Vérifier si une date est un jour ouvré (lundi-vendredi)
 */
export function isWeekday(date: Date): boolean {
  const day = date.getDay();
  return day !== 0 && day !== 6; // 0 = dimanche, 6 = samedi
}

/**
 * Calculer les jours ouvrés entre deux dates
 */
export function workdaysBetween(start: Date | string, end: Date | string): number {
  const startDate = startOfDay(new Date(start));
  const endDate = startOfDay(new Date(end));
  let count = 0;
  const current = new Date(startDate);

  while (current <= endDate) {
    if (isWeekday(current)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

/**
 * Ajouter des jours à une date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Retirer des jours à une date
 */
export function subtractDays(date: Date, days: number): Date {
  return addDays(date, -days);
}

/**
 * Vérifier si deux dates sont le même jour
 */
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Obtenir le nom du jour en français
 */
export function getDayName(date: Date): string {
  return new Date(date).toLocaleDateString('fr-FR', { weekday: 'long' });
}

/**
 * Obtenir le nom du mois en français
 */
export function getMonthName(date: Date): string {
  return new Date(date).toLocaleDateString('fr-FR', { month: 'long' });
}

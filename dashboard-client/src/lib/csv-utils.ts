/**
 * Utilitaires pour générer et télécharger des fichiers CSV
 */

/**
 * Convertit un tableau d'objets en CSV
 * @param data - Données à convertir
 * @param headers - En-têtes des colonnes (optionnel, utilise les clés de l'objet par défaut)
 * @returns Chaîne CSV
 */
export function generateCSV(data: Record<string, unknown>[], headers?: string[]): string {
  if (!data || data.length === 0) {
    return ''
  }

  // Utiliser les clés du premier objet si pas d'headers fournis
  const columnHeaders = headers || Object.keys(data[0]!)

  // En-tête CSV
  const csvHeaders = columnHeaders.join(',')

  // Lignes de données
  const csvRows = data.map((row) => {
    return columnHeaders
      .map((header) => {
        const value = row[header]
        // Échapper les guillemets et entourer de guillemets si nécessaire
        if (value === null || value === undefined) {
          return ''
        }
        const stringValue = String(value)
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
      })
      .join(',')
  })

  // UTF-8 BOM pour compatibilité Excel français
  const BOM = '\uFEFF'
  return BOM + csvHeaders + '\n' + csvRows.join('\n')
}

/**
 * Télécharge un CSV
 * @param csvContent - Contenu CSV
 * @param filename - Nom du fichier (par défaut : export.csv)
 */
export function downloadCSV(csvContent: string, filename = 'export.csv'): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')

  if (link.download !== undefined) {
    // Créer URL object
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

/**
 * Génère et télécharge un CSV en une seule opération
 * @param data - Données à exporter
 * @param filename - Nom du fichier
 * @param headers - En-têtes personnalisés (optionnel)
 */
export function exportToCSV(data: Record<string, unknown>[], filename: string, headers?: string[]): void {
  const csv = generateCSV(data, headers)
  downloadCSV(csv, filename)
}

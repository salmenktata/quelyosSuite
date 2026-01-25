/**
 * Import types - stub for finance module
 */

export interface ImportField {
  name: string
  required: boolean
  description: string
}

export interface ColumnMapping {
  sourceColumn: string
  targetField: string
  confidence: number
}

export interface ImportPreview {
  rows: Record<string, unknown>[]
  headers: string[]
  mappings: ColumnMapping[]
}

export interface ImportResult {
  success: boolean
  imported: number
  errors: string[]
}

export const IMPORT_FIELDS: ImportField[] = [
  { name: 'date', required: true, description: 'Date de la transaction' },
  { name: 'amount', required: true, description: 'Montant' },
  { name: 'description', required: false, description: 'Description' },
  { name: 'category', required: false, description: 'Catégorie' },
  { name: 'type', required: true, description: 'Type (credit/debit)' },
]

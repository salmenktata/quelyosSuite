/**
 * Import types - stub for finance module
 */

export type FieldType = 'date' | 'amount' | 'description' | 'category' | 'type' | 'account' | 'reference'

export type ImportStep = 'upload' | 'mapping' | 'validation' | 'import' | 'complete'

export interface StepInfo {
  id: string
  label: string
  completed: boolean
  icon?: React.ComponentType<{ className?: string }>
}

export interface UploadAnalysisResponse {
  success: boolean
  sessionId: string
  rowCount: number
  detectedBank?: {
    name: string
    id?: string
  }
  detectedColumns: {
    mappings: DetectedColumns
  }
  preview: Record<string, unknown>[]
  error?: string
}

export interface PreviewResponse {
  success: boolean
  totalRows: number
  previewRows: Array<{
    lineNumber: number
    error?: string
    [key: string]: string | number | boolean | undefined
  }>
  error?: string
}

export interface ConfirmImportResponse {
  success: boolean
  imported: number
  errors: string[]
  error?: string
}

export interface ImportState {
  currentStep: ImportStep
  file: File | null
  uploadProgress: number
  sessionId: string | null
  analysisResult: UploadAnalysisResponse | null
  previewData: PreviewResponse | null
  userMappings: CurrentMappings
  selectedAccountId: number | null
  importResults: ConfirmImportResponse | null
  isUploading: boolean
  isAnalyzing: boolean
  isImporting: boolean
  error: string | null
}

export type ImportAction =
  | { type: 'FILE_SELECTED'; payload: File }
  | { type: 'UPLOAD_PROGRESS'; payload: number }
  | { type: 'ANALYSIS_START' }
  | { type: 'ANALYSIS_SUCCESS'; payload: UploadAnalysisResponse }
  | { type: 'ANALYSIS_ERROR'; payload: string }
  | { type: 'UPDATE_MAPPING'; payload: { field: string; mapping: ColumnMapping | null } }
  | { type: 'RESET_MAPPINGS' }
  | { type: 'SELECT_ACCOUNT'; payload: number }
  | { type: 'PREVIEW_LOAD'; payload: PreviewResponse }
  | { type: 'IMPORT_START' }
  | { type: 'IMPORT_SUCCESS'; payload: ConfirmImportResponse }
  | { type: 'IMPORT_ERROR'; payload: string }
  | { type: 'NEXT_STEP' }
  | { type: 'PREVIOUS_STEP' }
  | { type: 'RESET_WIZARD' }

export interface ImportField {
  value: FieldType
  label: string
  required?: boolean
  description?: string
}

export interface ColumnMapping {
  columnIndex: number
  headerName: string
  confidence: number
}

export interface DetectedColumns {
  [key: string]: ColumnMapping
}

export interface CurrentMappings {
  [key: string]: ColumnMapping | undefined
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

export interface ColumnMappingTableProps {
  detectedColumns: DetectedColumns
  previewData: Record<string, unknown>[]
  currentMappings: CurrentMappings
  onMappingChange: (fieldType: FieldType, mapping: ColumnMapping | null) => void
  requiredFields: FieldType[]
}

export const TARGET_FIELDS: ImportField[] = [
  { value: 'date', label: 'Date', required: true, description: 'Date de la transaction' },
  { value: 'amount', label: 'Montant', required: true, description: 'Montant' },
  { value: 'description', label: 'Description', required: false, description: 'Description' },
  { value: 'category', label: 'Catégorie', required: false, description: 'Catégorie' },
  { value: 'type', label: 'Type', required: true, description: 'Type (credit/debit)' },
  { value: 'account', label: 'Compte', required: false, description: 'Compte' },
  { value: 'reference', label: 'Référence', required: false, description: 'Référence' },
]

export const IMPORT_FIELDS = TARGET_FIELDS

// Additional component props
export interface FileUploadZoneProps {
  onFileSelect: (file: File) => void | Promise<void>
  onError?: (error: Error | string) => void
  isLoading?: boolean
  accept?: string
  maxSize?: number
  maxSizeMB?: number
  disabled?: boolean
  className?: string
}

export interface ImportSummaryProps {
  results: ConfirmImportResponse | any
  onViewTransactions?: () => void | Promise<void>
  onImportAnother?: () => void
  totalRows?: number
  validRows?: number
  errorRows?: number
  errors?: Array<{ row: number; message: string }>
  warnings?: Array<{ row: number; message: string }>
  onConfirm?: () => void
  onCancel?: () => void
  isLoading?: boolean
}

export interface ImportWizardStepsProps {
  currentStep: number
  steps: Array<{ id: string; label: string; completed: boolean; icon?: React.ComponentType<{ className?: string }> }>
  onStepClick?: (stepIndex: number) => void
}

export interface ValidationErrorsProps {
  errors: Array<{
    line: number
    message: string
    severity: 'error' | 'warning' | 'info'
    field?: string
  }>
  onDownloadReport?: () => void
  className?: string
}

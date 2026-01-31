/**
 * Reducer pour la gestion de l'état de la page Contacts/Listes
 *
 * Centralise la gestion des 16 useState en un seul useReducer
 * pour améliorer la maintenabilité et la prévisibilité de l'état.
 */

import type { CSVPreviewResult } from '@/hooks/useContactLists'

// =============================================================================
// STATE TYPE
// =============================================================================

export interface ContactsState {
  // Modal states
  showCreateModal: boolean
  showImportModal: boolean
  deleteId: number | null

  // Search & filters
  searchTerm: string

  // New list form
  newListName: string
  newListDescription: string
  newListType: 'static' | 'dynamic'

  // CSV Import workflow
  csvData: string | null
  csvFileName: string
  csvPreview: CSVPreviewResult | null
  importStep: 'upload' | 'preview' | 'result'
  importListName: string
  importListId: number | null
  columnMapping: Record<string, string>
  importResult: {
    created: number
    updated: number
    errors: string[]
  } | null
}

// =============================================================================
// INITIAL STATE
// =============================================================================

export const initialContactsState: ContactsState = {
  // Modals
  showCreateModal: false,
  showImportModal: false,
  deleteId: null,

  // Search
  searchTerm: '',

  // New list form
  newListName: '',
  newListDescription: '',
  newListType: 'static',

  // CSV Import
  csvData: null,
  csvFileName: '',
  csvPreview: null,
  importStep: 'upload',
  importListName: '',
  importListId: null,
  columnMapping: {},
  importResult: null,
}

// =============================================================================
// ACTION TYPES
// =============================================================================

export type ContactsAction =
  // Modals
  | { type: 'OPEN_CREATE_MODAL' }
  | { type: 'CLOSE_CREATE_MODAL' }
  | { type: 'OPEN_IMPORT_MODAL' }
  | { type: 'CLOSE_IMPORT_MODAL' }
  | { type: 'SET_DELETE_ID'; payload: number | null }

  // Search
  | { type: 'SET_SEARCH_TERM'; payload: string }

  // New list form
  | { type: 'SET_NEW_LIST_NAME'; payload: string }
  | { type: 'SET_NEW_LIST_DESCRIPTION'; payload: string }
  | { type: 'SET_NEW_LIST_TYPE'; payload: 'static' | 'dynamic' }
  | { type: 'RESET_NEW_LIST_FORM' }

  // CSV Import
  | { type: 'SET_CSV_DATA'; payload: { data: string; fileName: string } }
  | { type: 'SET_CSV_PREVIEW'; payload: CSVPreviewResult }
  | { type: 'SET_IMPORT_STEP'; payload: 'upload' | 'preview' | 'result' }
  | { type: 'SET_IMPORT_LIST_NAME'; payload: string }
  | { type: 'SET_IMPORT_LIST_ID'; payload: number | null }
  | { type: 'SET_COLUMN_MAPPING'; payload: Record<string, string> }
  | { type: 'UPDATE_COLUMN_MAPPING'; payload: { field: string; value: string } }
  | { type: 'SET_IMPORT_RESULT'; payload: { created: number; updated: number; errors: string[] } }
  | { type: 'RESET_IMPORT_WORKFLOW' }

// =============================================================================
// REDUCER
// =============================================================================

export function contactsReducer(
  state: ContactsState,
  action: ContactsAction
): ContactsState {
  switch (action.type) {
    // Modals
    case 'OPEN_CREATE_MODAL':
      return { ...state, showCreateModal: true }

    case 'CLOSE_CREATE_MODAL':
      return {
        ...state,
        showCreateModal: false,
        // Reset form quand on ferme
        newListName: '',
        newListDescription: '',
        newListType: 'static',
      }

    case 'OPEN_IMPORT_MODAL':
      return { ...state, showImportModal: true }

    case 'CLOSE_IMPORT_MODAL':
      return {
        ...state,
        showImportModal: false,
        // Reset import workflow quand on ferme
        csvData: null,
        csvFileName: '',
        csvPreview: null,
        importStep: 'upload',
        importListName: '',
        importListId: null,
        columnMapping: {},
        importResult: null,
      }

    case 'SET_DELETE_ID':
      return { ...state, deleteId: action.payload }

    // Search
    case 'SET_SEARCH_TERM':
      return { ...state, searchTerm: action.payload }

    // New list form
    case 'SET_NEW_LIST_NAME':
      return { ...state, newListName: action.payload }

    case 'SET_NEW_LIST_DESCRIPTION':
      return { ...state, newListDescription: action.payload }

    case 'SET_NEW_LIST_TYPE':
      return { ...state, newListType: action.payload }

    case 'RESET_NEW_LIST_FORM':
      return {
        ...state,
        newListName: '',
        newListDescription: '',
        newListType: 'static',
      }

    // CSV Import
    case 'SET_CSV_DATA':
      return {
        ...state,
        csvData: action.payload.data,
        csvFileName: action.payload.fileName,
      }

    case 'SET_CSV_PREVIEW':
      return { ...state, csvPreview: action.payload }

    case 'SET_IMPORT_STEP':
      return { ...state, importStep: action.payload }

    case 'SET_IMPORT_LIST_NAME':
      return { ...state, importListName: action.payload }

    case 'SET_IMPORT_LIST_ID':
      return { ...state, importListId: action.payload }

    case 'SET_COLUMN_MAPPING':
      return { ...state, columnMapping: action.payload }

    case 'UPDATE_COLUMN_MAPPING':
      return {
        ...state,
        columnMapping: {
          ...state.columnMapping,
          [action.payload.field]: action.payload.value,
        },
      }

    case 'SET_IMPORT_RESULT':
      return { ...state, importResult: action.payload }

    case 'RESET_IMPORT_WORKFLOW':
      return {
        ...state,
        csvData: null,
        csvFileName: '',
        csvPreview: null,
        importStep: 'upload',
        importListName: '',
        importListId: null,
        columnMapping: {},
        importResult: null,
      }

    default:
      return state
  }
}

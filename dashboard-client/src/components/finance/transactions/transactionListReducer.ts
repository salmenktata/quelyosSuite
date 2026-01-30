/**
 * Reducer pour la gestion de l'état de TransactionListPage
 *
 * Centralise la gestion des 13 useState en un seul useReducer
 * pour améliorer la maintenabilité et la prévisibilité de l'état.
 */

// =============================================================================
// STATE TYPE
// =============================================================================

export type PaymentFlow =
  | "virement"
  | "carte"
  | "especes"
  | "cheque"
  | "prelevement"
  | "virement_bancaire"
  | "wire_transfer";

export interface Transaction {
  id: number;
  type: "credit" | "debit";
  description: string;
  tags?: string[];
  accountName?: string;
  categoryName?: string;
  paymentFlow?: PaymentFlow;
  amount: number;
  date: string;
  status?: "PENDING" | "CONFIRMED" | "CANCELLED";
}

export interface Category {
  id: number;
  name: string;
}

export interface TransactionListState {
  // Data
  transactions: Transaction[];
  categories: Category[];

  // Loading/Error
  loading: boolean;
  error: string | null;
  deletingId: number | null;

  // Filters
  search: string;
  statusFilter: string;
  categoryFilter: string;
  dateFrom: string;
  dateTo: string;
  showFilters: boolean;

  // Selection
  selectedIds: number[];
}

// =============================================================================
// INITIAL STATE
// =============================================================================

export const initialTransactionListState: TransactionListState = {
  transactions: [],
  categories: [],
  loading: false,
  error: null,
  deletingId: null,
  search: "",
  statusFilter: "all",
  categoryFilter: "all",
  dateFrom: "",
  dateTo: "",
  showFilters: false,
  selectedIds: [],
};

// =============================================================================
// ACTION TYPES
// =============================================================================

export type TransactionListAction =
  // Data
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'SET_CATEGORIES'; payload: Category[] }

  // Loading/Error
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_DELETING_ID'; payload: number | null }

  // Filters
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_STATUS_FILTER'; payload: string }
  | { type: 'SET_CATEGORY_FILTER'; payload: string }
  | { type: 'SET_DATE_FROM'; payload: string }
  | { type: 'SET_DATE_TO'; payload: string }
  | { type: 'TOGGLE_SHOW_FILTERS' }

  // Selection
  | { type: 'SET_SELECTED_IDS'; payload: number[] }
  | { type: 'TOGGLE_SELECT'; payload: number }
  | { type: 'TOGGLE_SELECT_ALL'; payload: number[] }
  | { type: 'CLEAR_SELECTION' };

// =============================================================================
// REDUCER
// =============================================================================

export function transactionListReducer(
  state: TransactionListState,
  action: TransactionListAction
): TransactionListState {
  switch (action.type) {
    // Data
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload };

    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };

    // Loading/Error
    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SET_DELETING_ID':
      return { ...state, deletingId: action.payload };

    // Filters
    case 'SET_SEARCH':
      return { ...state, search: action.payload };

    case 'SET_STATUS_FILTER':
      return { ...state, statusFilter: action.payload };

    case 'SET_CATEGORY_FILTER':
      return { ...state, categoryFilter: action.payload };

    case 'SET_DATE_FROM':
      return { ...state, dateFrom: action.payload };

    case 'SET_DATE_TO':
      return { ...state, dateTo: action.payload };

    case 'TOGGLE_SHOW_FILTERS':
      return { ...state, showFilters: !state.showFilters };

    // Selection
    case 'SET_SELECTED_IDS':
      return { ...state, selectedIds: action.payload };

    case 'TOGGLE_SELECT':
      return {
        ...state,
        selectedIds: state.selectedIds.includes(action.payload)
          ? state.selectedIds.filter((id) => id !== action.payload)
          : [...state.selectedIds, action.payload],
      };

    case 'TOGGLE_SELECT_ALL':
      return {
        ...state,
        selectedIds: state.selectedIds.length === action.payload.length
          ? []
          : action.payload,
      };

    case 'CLEAR_SELECTION':
      return { ...state, selectedIds: [] };

    default:
      return state;
  }
}

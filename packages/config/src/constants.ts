/**
 * Constantes globales pour Quelyos Suite
 *
 * Timeouts, clés localStorage, limites, etc.
 */

/**
 * Timeouts et délais (en millisecondes)
 */
export const TIMEOUTS = {
  /** Timeout requête API par défaut */
  API_REQUEST: 30000, // 30s

  /** Timeout requête API longue (upload, export) */
  API_REQUEST_LONG: 120000, // 2min

  /** Délai debounce recherche */
  SEARCH_DEBOUNCE: 300, // 300ms

  /** Délai debounce input */
  INPUT_DEBOUNCE: 500, // 500ms

  /** Délai toast notification */
  TOAST_DURATION: 5000, // 5s

  /** Délai toast erreur */
  TOAST_ERROR_DURATION: 10000, // 10s

  /** Délai auto-save */
  AUTO_SAVE: 2000, // 2s

  /** Délai refresh token */
  TOKEN_REFRESH: 300000, // 5min
} as const;

/**
 * Clés localStorage
 */
export const STORAGE_KEYS = {
  /** Token JWT */
  AUTH_TOKEN: 'quelyos_auth_token',

  /** Refresh token */
  REFRESH_TOKEN: 'quelyos_refresh_token',

  /** User data */
  USER_DATA: 'quelyos_user_data',

  /** Thème (light/dark) */
  THEME: 'quelyos_theme',

  /** Langue */
  LANGUAGE: 'quelyos_language',

  /** Tenant actuel */
  CURRENT_TENANT: 'quelyos_current_tenant',

  /** Sidebar collapsed */
  SIDEBAR_COLLAPSED: 'quelyos_sidebar_collapsed',

  /** Recent searches */
  RECENT_SEARCHES: 'quelyos_recent_searches',

  /** Draft data (formulaires) */
  DRAFT_PREFIX: 'quelyos_draft_',

  /** Onboarding completed */
  ONBOARDING_COMPLETED: 'quelyos_onboarding_completed',
} as const;

/**
 * Clés sessionStorage
 */
export const SESSION_KEYS = {
  /** Redirect URL après login */
  REDIRECT_URL: 'quelyos_redirect_url',

  /** Formulaire multi-étapes */
  FORM_STATE: 'quelyos_form_state',

  /** Filtres actifs */
  ACTIVE_FILTERS: 'quelyos_active_filters',
} as const;

/**
 * Limites de pagination et affichage
 */
export const LIMITS = {
  /** Items par page (tableau) */
  TABLE_PAGE_SIZE: 20,

  /** Items par page (grille) */
  GRID_PAGE_SIZE: 24,

  /** Items recherche autocomplete */
  AUTOCOMPLETE_RESULTS: 10,

  /** Max tags affichés */
  MAX_TAGS_DISPLAYED: 5,

  /** Max caractères prévisualisation */
  PREVIEW_MAX_CHARS: 200,

  /** Max fichiers upload simultanés */
  MAX_FILES_UPLOAD: 10,

  /** Taille max fichier upload (bytes) - 10MB */
  MAX_FILE_SIZE: 10 * 1024 * 1024,

  /** Taille max image (bytes) - 5MB */
  MAX_IMAGE_SIZE: 5 * 1024 * 1024,
} as const;

/**
 * Formats de date
 */
export const DATE_FORMATS = {
  /** Format date court : 01/02/2026 */
  SHORT: 'dd/MM/yyyy',

  /** Format date long : 1 février 2026 */
  LONG: 'd MMMM yyyy',

  /** Format date + heure : 01/02/2026 14:30 */
  DATETIME: 'dd/MM/yyyy HH:mm',

  /** Format heure : 14:30 */
  TIME: 'HH:mm',

  /** Format ISO : 2026-02-01T14:30:00Z */
  ISO: "yyyy-MM-dd'T'HH:mm:ss'Z'",

  /** Format API backend : 2026-02-01 14:30:00 */
  API: 'yyyy-MM-dd HH:mm:ss',
} as const;

/**
 * Codes d'erreur personnalisés
 */
export const ERROR_CODES = {
  /** Erreur réseau */
  NETWORK_ERROR: 'NETWORK_ERROR',

  /** Timeout */
  TIMEOUT: 'TIMEOUT',

  /** Non autorisé */
  UNAUTHORIZED: 'UNAUTHORIZED',

  /** Forbidden */
  FORBIDDEN: 'FORBIDDEN',

  /** Not found */
  NOT_FOUND: 'NOT_FOUND',

  /** Validation */
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  /** Serveur */
  SERVER_ERROR: 'SERVER_ERROR',

  /** Conflit */
  CONFLICT: 'CONFLICT',
} as const;

/**
 * Messages d'erreur par défaut
 */
export const ERROR_MESSAGES = {
  [ERROR_CODES.NETWORK_ERROR]: 'Erreur de connexion. Vérifiez votre connexion Internet.',
  [ERROR_CODES.TIMEOUT]: 'La requête a pris trop de temps. Veuillez réessayer.',
  [ERROR_CODES.UNAUTHORIZED]: 'Session expirée. Veuillez vous reconnecter.',
  [ERROR_CODES.FORBIDDEN]: "Vous n'avez pas les permissions nécessaires.",
  [ERROR_CODES.NOT_FOUND]: 'Ressource introuvable.',
  [ERROR_CODES.VALIDATION_ERROR]: 'Données invalides. Vérifiez les champs.',
  [ERROR_CODES.SERVER_ERROR]: 'Erreur serveur. Veuillez réessayer plus tard.',
  [ERROR_CODES.CONFLICT]: 'Conflit détecté. La ressource a peut-être été modifiée.',
} as const;

/**
 * Regex patterns
 */
export const PATTERNS = {
  /** Email */
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,

  /** Téléphone français */
  PHONE_FR: /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/,

  /** Code postal français */
  POSTAL_CODE_FR: /^[0-9]{5}$/,

  /** SIRET */
  SIRET: /^[0-9]{14}$/,

  /** SIREN */
  SIREN: /^[0-9]{9}$/,

  /** TVA intracommunautaire française */
  VAT_FR: /^FR[0-9A-Z]{2}\s?[0-9]{9}$/,

  /** Slug (URL-safe) */
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,

  /** Couleur hex */
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
} as const;

/**
 * Valeurs par défaut
 */
export const DEFAULTS = {
  /** Langue par défaut */
  LANGUAGE: 'fr',

  /** Devise par défaut */
  CURRENCY: 'EUR',

  /** Timezone par défaut */
  TIMEZONE: 'Europe/Paris',

  /** Thème par défaut */
  THEME: 'light' as const,

  /** Avatar par défaut */
  AVATAR_PLACEHOLDER: '/images/avatar-placeholder.png',

  /** Image produit par défaut */
  PRODUCT_IMAGE_PLACEHOLDER: '/images/product-placeholder.png',
} as const;

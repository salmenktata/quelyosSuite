/**
 * @quelyos/utils
 * Utilitaires communs pour toutes les applications Quelyos
 */

// Classes CSS
export { cn } from "./src/cn";

// Formatage
export {
  formatCurrency,
  formatDate,
  formatRelativeTime,
  formatNumber,
  formatPercentage,
} from "./src/format";

// Validation
export {
  isValidEmail,
  isValidPassword,
  isValidPhoneNumber,
  isValidSiret,
  isValidIBAN,
  isValidURL,
} from "./src/validation";

// Async
export {
  debounce,
  throttle,
  sleep,
  retry,
  promiseWithTimeout,
} from "./src/async";

// String
export {
  generateId,
  truncate,
  capitalize,
  toCamelCase,
  toKebabCase,
  toSnakeCase,
  removeAccents,
  slugify,
  parseQueryString,
  buildQueryString,
} from "./src/string";

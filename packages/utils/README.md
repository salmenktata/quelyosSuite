# @quelyos/utils

> Utilitaires communs pour toutes les applications Quelyos

## 🎯 Contenu

- **Classes CSS** : `cn()` pour Tailwind
- **Formatage** : Dates, montants, nombres, pourcentages
- **Validation** : Email, password, téléphone, SIRET, IBAN, URL
- **Async** : Debounce, throttle, retry, timeout
- **String** : Slugify, camelCase, kebab-case, truncate, etc.

## 🚀 Installation

```bash
npm install @quelyos/utils
```

## 📚 Usage

### Classes CSS

```typescript
import { cn } from "@quelyos/utils";

// Combine et résout les conflits Tailwind
const className = cn(
  "px-4 py-2",
  "bg-blue-500 hover:bg-blue-600",
  isActive && "bg-green-500", // Conditionnel
  extraClasses // Classes dynamiques
);
```

### Formatage

```typescript
import {
  formatCurrency,
  formatDate,
  formatRelativeTime,
  formatNumber,
  formatPercentage,
} from "@quelyos/utils";

formatCurrency(1234.56); // "1 234,56 €"
formatDate(new Date()); // "13/12/2025"
formatRelativeTime(new Date(Date.now() - 3600000)); // "il y a 1 heure"
formatNumber(1234567); // "1 234 567"
formatPercentage(75.5); // "75,5 %"
```

### Validation

```typescript
import {
  isValidEmail,
  isValidPassword,
  isValidPhoneNumber,
  isValidSiret,
  isValidIBAN,
} from "@quelyos/utils";

isValidEmail("user@example.com"); // true
isValidPassword("Password123"); // true
isValidPhoneNumber("06 12 34 56 78"); // true
isValidSiret("12345678901234"); // true/false (vérifie Luhn)
isValidIBAN("FR76 1234 5678 9012 3456 7890 123"); // true
```

### Async

```typescript
import { debounce, throttle, retry, sleep } from "@quelyos/utils";

// Debounce (attend la fin des appels)
const debouncedSearch = debounce((query) => {
  console.log("Searching:", query);
}, 300);

// Throttle (limite les appels)
const throttledScroll = throttle(() => {
  console.log("Scrolling");
}, 100);

// Retry avec backoff exponentiel
const data = await retry(() => fetch("/api/data").then((r) => r.json()), {
  maxAttempts: 3,
  delay: 1000,
  backoff: 2,
});

// Sleep
await sleep(1000); // Attend 1 seconde
```

### String

```typescript
import {
  slugify,
  capitalize,
  toCamelCase,
  toKebabCase,
  truncate,
} from "@quelyos/utils";

slugify("Ça c'est un Titre!"); // "ca-cest-un-titre"
capitalize("hello world"); // "Hello world"
toCamelCase("hello-world"); // "helloWorld"
toKebabCase("helloWorld"); // "hello-world"
truncate("Long text", 10); // "Long te..."
```

## 🔧 API Reference

### Classes CSS

- `cn(...inputs: ClassValue[]): string` - Combine classes Tailwind

### Formatage

- `formatCurrency(amount: number, currency?: string, locale?: string): string`
- `formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions, locale?: string): string`
- `formatRelativeTime(date: Date | string, locale?: string): string`
- `formatNumber(number: number, options?: Intl.NumberFormatOptions, locale?: string): string`
- `formatPercentage(value: number, decimals?: number, locale?: string): string`

### Validation

- `isValidEmail(email: string): boolean`
- `isValidPassword(password: string): boolean`
- `isValidPhoneNumber(phone: string): boolean`
- `isValidSiret(siret: string): boolean`
- `isValidIBAN(iban: string): boolean`
- `isValidURL(url: string): boolean`

### Async

- `debounce<T>(func: T, wait: number): T`
- `throttle<T>(func: T, limit: number): T`
- `sleep(ms: number): Promise<void>`
- `retry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T>`
- `promiseWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T>`

### String

- `generateId(prefix?: string): string`
- `truncate(text: string, maxLength: number, suffix?: string): string`
- `capitalize(text: string): string`
- `toCamelCase(text: string): string`
- `toKebabCase(text: string): string`
- `toSnakeCase(text: string): string`
- `removeAccents(text: string): string`
- `slugify(text: string): string`
- `parseQueryString(queryString: string): Record<string, string>`
- `buildQueryString(params: Record<string, unknown>): string`

## 📝 Changelog

### v1.0.0

- ✅ Utilitaires classes CSS (cn)
- ✅ Formatage dates, montants, nombres
- ✅ Validation email, password, téléphone, SIRET, IBAN
- ✅ Async helpers (debounce, throttle, retry, sleep)
- ✅ String utilities (slugify, camelCase, etc.)

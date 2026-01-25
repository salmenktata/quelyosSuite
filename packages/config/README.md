# @quelyos/config

Shared configuration files for Quelyos monorepo apps.

## Exports

### TypeScript
```json
{
  "extends": "@quelyos/config/typescript"
}
```

### ESLint (Next.js)
```javascript
import quelyosConfig from "@quelyos/config/eslint/next";
export default quelyosConfig;
```

### Tailwind CSS
```javascript
const baseConfig = require("@quelyos/config/tailwind");

module.exports = {
  ...baseConfig,
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/**/*.{js,ts,jsx,tsx}", // Include shared UI components
  ],
};
```

### PostCSS
```javascript
module.exports = require("@quelyos/config/postcss");
```

## Benefits

- **Consistency** - All apps use the same base configurations
- **DRY** - Update once, apply everywhere
- **Type safety** - Shared TypeScript settings ensure compatibility
- **Maintainability** - Centralized config management

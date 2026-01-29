import Ajv, { type ErrorObject } from 'ajv';
import themeSchema from '@/schemas/theme.schema.json';

/**
 * Instance Ajv pour validation JSON Schema
 */
const ajv = new Ajv({
  allErrors: true,
  verbose: true,
});

// Compiler le schéma
const validateTheme = ajv.compile(themeSchema);

/**
 * Interface pour le résultat de validation
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Valider un theme config contre le JSON Schema
 */
export function validateThemeConfig(config: unknown): ValidationResult {
  const valid = validateTheme(config);

  if (valid) {
    return {
      valid: true,
      errors: [],
    };
  }

  // Formater les erreurs en messages lisibles
  const errors = (validateTheme.errors || []).map((error: ErrorObject) => {
    const path = error.instancePath || 'root';
    const message = error.message || 'Erreur de validation';

    switch (error.keyword) {
      case 'required':
        return `${path} : Propriété manquante "${error.params.missingProperty}"`;
      case 'pattern':
        return `${path} : Format invalide (attendu: ${error.params.pattern})`;
      case 'enum':
        return `${path} : Valeur invalide (attendu: ${error.params.allowedValues?.join(', ')})`;
      case 'type':
        return `${path} : Type invalide (attendu: ${error.params.type})`;
      case 'minLength':
        return `${path} : Trop court (min: ${error.params.limit} caractères)`;
      case 'additionalProperties':
        return `${path} : Propriété non autorisée "${error.params.additionalProperty}"`;
      default:
        return `${path} : ${message}`;
    }
  });

  return {
    valid: false,
    errors,
  };
}

/**
 * Valider et retourner erreurs formatées pour toast
 */
export function getValidationErrors(config: unknown): string | null {
  const result = validateThemeConfig(config);

  if (result.valid) {
    return null;
  }

  // Retourner les 3 premières erreurs
  const errorMessages = result.errors.slice(0, 3);
  const remaining = result.errors.length - 3;

  return (
    errorMessages.join('\n') +
    (remaining > 0 ? `\n... et ${remaining} autre${remaining > 1 ? 's' : ''} erreur${remaining > 1 ? 's' : ''}` : '')
  );
}

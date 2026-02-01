/**
 * Hooks de validation pour Quelyos Dashboard
 *
 * Intégration de Zod avec React Hook Form.
 */

import { useCallback } from 'react'
import { z } from 'zod'
import { useForm, FieldValues, UseFormProps } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

/**
 * Hook pour formulaire avec validation Zod
 *
 * @example
 * const form = useZodForm(productSchema, {
 *   defaultValues: { name: '', price: 0 }
 * })
 *
 * <form onSubmit={form.handleSubmit(onSubmit)}>
 *   <input {...form.register('name')} />
 *   {form.formState.errors.name?.message}
 * </form>
 */
export function useZodForm<TOutput extends FieldValues>(
  schema: z.ZodType<TOutput>,
  options?: Omit<UseFormProps<TOutput>, 'resolver'>
) {
  return useForm({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema),
    mode: 'onBlur',
    ...options,
  })
}

/**
 * Hook pour validation à la demande
 *
 * @example
 * const validate = useValidation(productSchema)
 *
 * const handleSubmit = async () => {
 *   const result = validate(formData)
 *   if (result.success) {
 *     await saveProduct(result.data)
 *   } else {
 *     showErrors(result.errors)
 *   }
 * }
 */
export function useValidation<TSchema extends z.ZodType>(schema: TSchema) {
  return useCallback(
    (
      data: unknown
    ): { success: true; data: z.infer<TSchema> } | { success: false; errors: ValidationError[] } => {
      const result = schema.safeParse(data)

      if (result.success) {
        return { success: true, data: result.data }
      }

      const errors: ValidationError[] = result.error.issues.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
        code: err.code,
      }))

      return { success: false, errors }
    },
    [schema]
  )
}

export interface ValidationError {
  path: string
  message: string
  code: string
}

/**
 * Hook pour validation async (ex: vérifier unicité email)
 *
 * @example
 * const validateAsync = useAsyncValidation(emailSchema, async (email) => {
 *   const exists = await checkEmailExists(email)
 *   if (exists) throw new Error('Cet email est déjà utilisé')
 * })
 */
export function useAsyncValidation<TSchema extends z.ZodType>(
  schema: TSchema,
  asyncValidator?: (data: z.infer<TSchema>) => Promise<void>
) {
  return useCallback(
    async (
      data: unknown
    ): Promise<{ success: true; data: z.infer<TSchema> } | { success: false; errors: ValidationError[] }> => {
      // Validation Zod d'abord
      const result = schema.safeParse(data)

      if (!result.success) {
        const errors: ValidationError[] = result.error.issues.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
          code: err.code,
        }))
        return { success: false, errors }
      }

      // Validation async ensuite
      if (asyncValidator) {
        try {
          await asyncValidator(result.data)
        } catch (error) {
          return {
            success: false,
            errors: [
              {
                path: '',
                message: error instanceof Error ? error.message : 'Erreur de validation',
                code: 'async_validation',
              },
            ],
          }
        }
      }

      return { success: true, data: result.data }
    },
    [schema, asyncValidator]
  )
}

/**
 * Formatte les erreurs de validation pour affichage
 */
export function formatValidationErrors(errors: ValidationError[]): Record<string, string> {
  return errors.reduce(
    (acc, error) => {
      acc[error.path || '_root'] = error.message
      return acc
    },
    {} as Record<string, string>
  )
}

/**
 * Extrait le premier message d'erreur
 */
export function getFirstError(errors: ValidationError[]): string | null {
  return errors.length > 0 ? errors[0].message : null
}

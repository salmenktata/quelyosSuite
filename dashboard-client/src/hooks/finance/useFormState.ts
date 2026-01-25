import { useState, useCallback, useEffect } from "react";

export interface UseFormStateOptions<T> {
  initialValues: T;
  onSubmit?: (values: T) => Promise<void> | void;
  validate?: (values: T) => Partial<Record<keyof T, string>>;
  resetOnSubmitSuccess?: boolean;
}

export interface UseFormStateReturn<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isDirty: boolean;
  setFieldValue: (field: keyof T, value: any) => void;
  setFieldTouched: (field: keyof T, isTouched?: boolean) => void;
  setFieldError: (field: keyof T, error: string) => void;
  handleChange: (field: keyof T) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleBlur: (field: keyof T) => () => void;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  handleReset: () => void;
  setValues: (values: T) => void;
}

/**
 * Generic form state management hook
 *
 * @example
 * const form = useFormState({
 *   initialValues: { name: '', email: '' },
 *   validate: (values) => {
 *     const errors: any = {};
 *     if (!values.name) errors.name = 'Required';
 *     return errors;
 *   },
 *   onSubmit: async (values) => {
 *     await api.post('/users', values);
 *   }
 * });
 *
 * // In JSX:
 * <input
 *   value={form.values.name}
 *   onChange={form.handleChange('name')}
 *   onBlur={form.handleBlur('name')}
 * />
 * {form.touched.name && form.errors.name && <span>{form.errors.name}</span>}
 */
export function useFormState<T extends Record<string, any>>({
  initialValues,
  onSubmit,
  validate,
  resetOnSubmitSuccess = false,
}: UseFormStateOptions<T>): UseFormStateReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Check if form is dirty
  useEffect(() => {
    const isChanged = Object.keys(initialValues).some(
      (key) => initialValues[key as keyof T] !== values[key as keyof T]
    );
    setIsDirty(isChanged);
  }, [values, initialValues]);

  const setFieldValue = useCallback((field: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is modified
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const setFieldTouched = useCallback((field: keyof T, isTouched = true) => {
    setTouched((prev) => ({ ...prev, [field]: isTouched }));
  }, []);

  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors((prev) => ({ ...prev, [field]: error }));
  }, []);

  const handleChange = useCallback(
    (field: keyof T) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const value = e.target.type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : e.target.value;
        setFieldValue(field, value);
      },
    [setFieldValue]
  );

  const handleBlur = useCallback(
    (field: keyof T) => () => {
      setFieldTouched(field, true);

      // Run validation on blur if validate function provided
      if (validate) {
        const validationErrors = validate(values);
        if (validationErrors[field]) {
          setFieldError(field, validationErrors[field]!);
        }
      }
    },
    [values, validate, setFieldTouched, setFieldError]
  );

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }

      // Mark all fields as touched
      const allTouched = Object.keys(values).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {}
      );
      setTouched(allTouched);

      // Validate all fields
      if (validate) {
        const validationErrors = validate(values);
        setErrors(validationErrors);

        // Don't submit if there are errors
        if (Object.keys(validationErrors).length > 0) {
          return;
        }
      }

      // Submit
      if (onSubmit) {
        setIsSubmitting(true);
        try {
          await onSubmit(values);
          if (resetOnSubmitSuccess) {
            handleReset();
          }
        } finally {
          setIsSubmitting(false);
        }
      }
    },
    [values, validate, onSubmit, resetOnSubmitSuccess]
  );

  const handleReset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsDirty(false);
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isDirty,
    setFieldValue,
    setFieldTouched,
    setFieldError,
    handleChange,
    handleBlur,
    handleSubmit,
    handleReset,
    setValues,
  };
}

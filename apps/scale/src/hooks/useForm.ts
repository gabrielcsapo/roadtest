import { useState, useCallback } from "react";

export type FormValues = Record<string, string | boolean | number>;
export type FormErrors = Record<string, string>;
export type FormTouched = Record<string, boolean>;
export type Validator<T extends FormValues> = (values: T) => FormErrors;

export interface UseFormReturn<T extends FormValues> {
  values: T;
  errors: FormErrors;
  touched: FormTouched;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  setValue: (name: keyof T, value: T[keyof T]) => void;
  setValues: (values: Partial<T>) => void;
  setError: (name: string, error: string) => void;
  clearError: (name: string) => void;
  touch: (name: keyof T) => void;
  touchAll: () => void;
  reset: () => void;
  handleSubmit: (onSubmit: (values: T) => void | Promise<void>) => (e?: React.FormEvent) => void;
}

export function useForm<T extends FormValues>(
  initialValues: T,
  validator?: Validator<T>,
): UseFormReturn<T> {
  const [values, setValuesState] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<FormTouched>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = useCallback(
    (vals: T): FormErrors => {
      return validator ? validator(vals) : {};
    },
    [validator],
  );

  const isValid = Object.keys(validate(values)).length === 0;

  const isDirty = Object.keys(initialValues).some((k) => values[k] !== initialValues[k]);

  const setValue = useCallback(
    (name: keyof T, value: T[keyof T]) => {
      setValuesState((prev) => {
        const next = { ...prev, [name]: value };
        if (validator) {
          const errs = validator(next);
          setErrors(errs);
        }
        return next;
      });
    },
    [validator],
  );

  const setValues = useCallback(
    (partial: Partial<T>) => {
      setValuesState((prev) => {
        const next = { ...prev, ...partial };
        if (validator) {
          setErrors(validator(next));
        }
        return next;
      });
    },
    [validator],
  );

  const setError = useCallback((name: string, error: string) => {
    setErrors((prev) => ({ ...prev, [name]: error }));
  }, []);

  const clearError = useCallback((name: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  const touch = useCallback((name: keyof T) => {
    setTouched((prev) => ({ ...prev, [name as string]: true }));
  }, []);

  const touchAll = useCallback(() => {
    const all: FormTouched = {};
    Object.keys(values).forEach((k) => {
      all[k] = true;
    });
    setTouched(all);
  }, [values]);

  const reset = useCallback(() => {
    setValuesState(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  const handleSubmit = useCallback(
    (onSubmit: (values: T) => void | Promise<void>) => (e?: React.FormEvent) => {
      e?.preventDefault();
      const errs = validate(values);
      if (Object.keys(errs).length > 0) {
        setErrors(errs);
        touchAll();
        return;
      }
      setIsSubmitting(true);
      Promise.resolve(onSubmit(values)).finally(() => setIsSubmitting(false));
    },
    [values, validate, touchAll],
  );

  return {
    values,
    errors,
    touched,
    isValid,
    isDirty,
    isSubmitting,
    setValue,
    setValues,
    setError,
    clearError,
    touch,
    touchAll,
    reset,
    handleSubmit,
  };
}

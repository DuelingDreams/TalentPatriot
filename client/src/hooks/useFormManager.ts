
import { useState, useCallback } from 'react'

interface UseFormManagerOptions<T> {
  initialValues: T
  validate?: (values: T) => Record<string, string>
  onSubmit: (values: T) => Promise<void>
}

export function useFormManager<T extends Record<string, any>>({
  initialValues,
  validate,
  onSubmit
}: UseFormManagerOptions<T>) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const setValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }))
    if (touched[field as string]) {
      // Clear error when user starts typing
      setErrors(prev => ({ ...prev, [field as string]: '' }))
    }
  }, [touched])

  const setFieldTouched = useCallback((field: keyof T) => {
    setTouched(prev => ({ ...prev, [field as string]: true }))
    
    if (validate) {
      const validationErrors = validate(values)
      if (validationErrors[field as string]) {
        setErrors(prev => ({ 
          ...prev, 
          [field as string]: validationErrors[field as string] 
        }))
      }
    }
  }, [values, validate])

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    setIsSubmitting(true)
    
    try {
      if (validate) {
        const validationErrors = validate(values)
        if (Object.keys(validationErrors).length > 0) {
          setErrors(validationErrors)
          return
        }
      }
      
      await onSubmit(values)
      setValues(initialValues) // Reset form on successful submit
      setTouched({})
      setErrors({})
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [values, validate, onSubmit, initialValues])

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }, [initialValues])

  return {
    values,
    errors,
    isSubmitting,
    touched,
    setValue,
    setFieldTouched,
    handleSubmit,
    reset,
    isValid: Object.keys(errors).length === 0
  }
}

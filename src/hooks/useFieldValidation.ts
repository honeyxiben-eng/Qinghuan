'use client'
import { useState, useCallback } from 'react'
import { ZodSchema } from 'zod'

export function useFieldValidation<T>(schema: ZodSchema<T>) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = useCallback((data: Partial<T>) => {
    const result = schema.safeParse(data)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const path = issue.path.join('.')
        if (!fieldErrors[path]) fieldErrors[path] = issue.message
      }
      setErrors(fieldErrors)
      return false
    }
    setErrors({})
    return true
  }, [schema])

  const validateField = useCallback((fieldName: string, value: any) => {
    const result = schema.safeParse({ [fieldName]: value })
    if (!result.success) {
      const issue = result.error.issues.find(i => i.path.join('.') === fieldName)
      if (issue) {
        setErrors(prev => ({ ...prev, [fieldName]: issue.message }))
        return false
      }
    }
    setErrors(prev => {
      const next = { ...prev }
      delete next[fieldName]
      return next
    })
    return true
  }, [schema])

  const clearErrors = useCallback(() => setErrors({}), [])

  return { errors, validate, validateField, clearErrors }
}

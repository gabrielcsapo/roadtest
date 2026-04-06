import { useState, useCallback } from 'react'

export interface UseFilterReturn<T extends Record<string, unknown>> {
  filters: T
  setFilter: <K extends keyof T>(key: K, value: T[K]) => void
  toggleFilter: <K extends keyof T>(key: K, value: T[K] extends (infer V)[] ? V : T[K]) => void
  clearFilter: (key: keyof T) => void
  clearAllFilters: () => void
  hasFilters: boolean
}

export function useFilter<T extends Record<string, unknown>>(initialFilters: T): UseFilterReturn<T> {
  const [filters, setFilters] = useState<T>(initialFilters)

  const setFilter = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const toggleFilter = useCallback(<K extends keyof T>(
    key: K,
    value: T[K] extends (infer V)[] ? V : T[K]
  ) => {
    setFilters(prev => {
      const current = prev[key]
      if (Array.isArray(current)) {
        const arr = current as unknown[]
        const idx = arr.indexOf(value)
        const newArr = idx >= 0 ? arr.filter((_, i) => i !== idx) : [...arr, value]
        return { ...prev, [key]: newArr }
      }
      return { ...prev, [key]: current === value ? undefined : value }
    })
  }, [])

  const clearFilter = useCallback((key: keyof T) => {
    setFilters(prev => ({ ...prev, [key]: initialFilters[key] }))
  }, [initialFilters])

  const clearAllFilters = useCallback(() => {
    setFilters(initialFilters)
  }, [initialFilters])

  const hasFilters = Object.keys(filters).some(k => {
    const v = filters[k as keyof T]
    const init = initialFilters[k as keyof T]
    if (Array.isArray(v) && Array.isArray(init)) return v.length !== init.length
    return v !== init
  })

  return { filters, setFilter, toggleFilter, clearFilter, clearAllFilters, hasFilters }
}

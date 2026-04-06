import { useState, useCallback } from 'react'
import { useDebounce } from './useDebounce'

export interface UseSearchReturn {
  query: string
  debouncedQuery: string
  setQuery: (q: string) => void
  clearSearch: () => void
  hasQuery: boolean
}

export function useSearch(initialQuery = '', debounceDelay = 300): UseSearchReturn {
  const [query, setQueryState] = useState(initialQuery)
  const debouncedQuery = useDebounce(query, debounceDelay)

  const setQuery = useCallback((q: string) => {
    setQueryState(q)
  }, [])

  const clearSearch = useCallback(() => {
    setQueryState('')
  }, [])

  return {
    query,
    debouncedQuery,
    setQuery,
    clearSearch,
    hasQuery: query.trim().length > 0,
  }
}

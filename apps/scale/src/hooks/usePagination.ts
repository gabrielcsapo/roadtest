import { useState, useCallback } from 'react'
import { clampPage, getTotalPages } from '../utils/pagination'

export interface UsePaginationReturn {
  page: number
  pageSize: number
  totalPages: number
  goToPage: (page: number) => void
  nextPage: () => void
  prevPage: () => void
  setPageSize: (size: number) => void
  isFirstPage: boolean
  isLastPage: boolean
}

export function usePagination(total: number, initialPage = 1, initialPageSize = 10): UsePaginationReturn {
  const [page, setPage] = useState(initialPage)
  const [pageSize, setPageSizeState] = useState(initialPageSize)

  const totalPages = getTotalPages(total, pageSize)

  const goToPage = useCallback(
    (newPage: number) => {
      setPage(clampPage(newPage, total, pageSize))
    },
    [total, pageSize]
  )

  const nextPage = useCallback(() => {
    setPage(prev => Math.min(prev + 1, totalPages || 1))
  }, [totalPages])

  const prevPage = useCallback(() => {
    setPage(prev => Math.max(prev - 1, 1))
  }, [])

  const setPageSize = useCallback(
    (size: number) => {
      setPageSizeState(size)
      setPage(1)
    },
    []
  )

  return {
    page,
    pageSize,
    totalPages,
    goToPage,
    nextPage,
    prevPage,
    setPageSize,
    isFirstPage: page === 1,
    isLastPage: page >= totalPages,
  }
}

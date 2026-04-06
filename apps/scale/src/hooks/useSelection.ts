import { useState, useCallback } from 'react'

export interface UseSelectionReturn {
  selectedIds: Set<string>
  isSelected: (id: string) => boolean
  toggle: (id: string) => void
  select: (id: string) => void
  deselect: (id: string) => void
  selectAll: (ids: string[]) => void
  deselectAll: () => void
  selectedCount: number
  hasSelection: boolean
}

export function useSelection(initialIds: string[] = []): UseSelectionReturn {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialIds))

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds])

  const toggle = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const select = useCallback((id: string) => {
    setSelectedIds(prev => new Set([...prev, id]))
  }, [])

  const deselect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [])

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids))
  }, [])

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  return {
    selectedIds,
    isSelected,
    toggle,
    select,
    deselect,
    selectAll,
    deselectAll,
    selectedCount: selectedIds.size,
    hasSelection: selectedIds.size > 0,
  }
}

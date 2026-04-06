import React, { useState, useRef, useEffect } from 'react'
import { Vendor } from '../../types'
import { Button } from '../ui/Button'
import { Spinner } from '../ui/Spinner'

type ExportFormat = 'csv' | 'json' | 'pdf'

interface VendorExportButtonProps {
  vendors: Vendor[]
  onExport: (format: ExportFormat) => void
  loading?: boolean
  disabled?: boolean
}

const FORMAT_OPTIONS: { format: ExportFormat; label: string }[] = [
  { format: 'csv', label: 'Export as CSV' },
  { format: 'json', label: 'Export as JSON' },
  { format: 'pdf', label: 'Export as PDF' },
]

export function VendorExportButton({ vendors, onExport, loading = false, disabled = false }: VendorExportButtonProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (format: ExportFormat) => {
    setOpen(false)
    onExport(format)
  }

  const isDisabled = disabled || loading || vendors.length === 0

  return (
    <div data-testid="vendor-export-button" ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <Button
        data-testid="export-trigger-button"
        variant="secondary"
        onClick={() => !isDisabled && setOpen(prev => !prev)}
        disabled={isDisabled}
        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
      >
        {loading && <Spinner data-testid="export-spinner" size="sm" />}
        Export {vendors.length > 0 ? `(${vendors.length})` : ''}
        <span data-testid="export-chevron" style={{ fontSize: '10px' }}>▼</span>
      </Button>

      {open && (
        <div data-testid="export-dropdown" style={{ position: 'absolute', top: '100%', right: 0, zIndex: 100, backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '6px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', minWidth: '160px' }}>
          {FORMAT_OPTIONS.map(({ format, label }) => (
            <button
              key={format}
              data-testid={`export-option-${format}`}
              onClick={() => handleSelect(format)}
              style={{ display: 'block', width: '100%', padding: '8px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {vendors.length === 0 && (
        <span data-testid="export-empty-hint" style={{ position: 'absolute', top: '100%', right: 0, fontSize: '12px', color: '#9ca3af', whiteSpace: 'nowrap' }}>
          No vendors to export
        </span>
      )}
    </div>
  )
}

export default VendorExportButton

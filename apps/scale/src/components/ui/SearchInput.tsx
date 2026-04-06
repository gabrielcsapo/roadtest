import React, { useState, useRef, useCallback } from 'react'

export type SearchInputSize = 'sm' | 'md' | 'lg'

export interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onClear?: () => void
  loading?: boolean
  debounce?: number
  size?: SearchInputSize
  className?: string
  'data-testid'?: string
}

const sizeStyles: Record<SearchInputSize, React.CSSProperties> = {
  sm: { fontSize: '12px', padding: '6px 10px 6px 30px', height: '32px' },
  md: { fontSize: '14px', padding: '8px 12px 8px 36px', height: '38px' },
  lg: { fontSize: '16px', padding: '10px 14px 10px 42px', height: '44px' },
}

const iconSize: Record<SearchInputSize, number> = { sm: 14, md: 16, lg: 18 }
const iconLeft: Record<SearchInputSize, string> = { sm: '8px', md: '10px', lg: '12px' }

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  onClear,
  loading = false,
  debounce: debounceMs = 0,
  size = 'md',
  className,
  'data-testid': testId = 'search-input',
}) => {
  const [localValue, setLocalValue] = useState(value)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value
    setLocalValue(newVal)
    if (debounceMs > 0) {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => onChange(newVal), debounceMs)
    } else {
      onChange(newVal)
    }
  }, [onChange, debounceMs])

  const handleClear = useCallback(() => {
    setLocalValue('')
    onChange('')
    onClear?.()
  }, [onChange, onClear])

  const wrapperStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    width: '100%',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: '#1e1e2e',
    border: '1px solid #3a3a4a',
    borderRadius: '6px',
    color: '#e0e0f0',
    fontFamily: 'inherit',
    outline: 'none',
    paddingRight: (localValue || value) ? '36px' : '12px',
    boxSizing: 'border-box',
    ...sizeStyles[size],
  }

  const searchIconStyle: React.CSSProperties = {
    position: 'absolute',
    left: iconLeft[size],
    color: '#6b6b8a',
    pointerEvents: 'none',
    fontSize: `${iconSize[size]}px`,
  }

  const clearBtnStyle: React.CSSProperties = {
    position: 'absolute',
    right: '8px',
    background: 'none',
    border: 'none',
    color: '#6b6b8a',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '2px',
    lineHeight: 1,
    display: 'flex',
    alignItems: 'center',
  }

  const displayValue = debounceMs > 0 ? localValue : value

  return (
    <div style={wrapperStyle} className={className} data-testid={`${testId}-wrapper`}>
      <span style={searchIconStyle} data-testid={`${testId}-icon`} aria-hidden>
        {loading ? '⟳' : '⌕'}
      </span>
      <input
        type="search"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        style={inputStyle}
        data-testid={testId}
        aria-label={placeholder}
        role="searchbox"
      />
      {(displayValue) && (onClear !== undefined) && (
        <button
          style={clearBtnStyle}
          onClick={handleClear}
          data-testid={`${testId}-clear`}
          aria-label="Clear search"
          type="button"
        >
          ×
        </button>
      )}
      {loading && (
        <span style={{ position: 'absolute', right: '8px' }} data-testid={`${testId}-loading`} aria-label="Loading">
          ⟳
        </span>
      )}
    </div>
  )
}

export default SearchInput

import React from 'react'

type Size = 'sm' | 'md'

interface VendorCategoryTagProps {
  category: string
  color?: string
  onClick?: (category: string) => void
  onRemove?: (category: string) => void
  size?: Size
}

const SIZE_STYLES: Record<Size, React.CSSProperties> = {
  sm: { fontSize: '11px', padding: '2px 6px', borderRadius: '4px' },
  md: { fontSize: '13px', padding: '4px 10px', borderRadius: '6px' },
}

export function VendorCategoryTag({ category, color = '#e0e7ff', onClick, onRemove, size = 'md' }: VendorCategoryTagProps) {
  const handleClick = () => onClick?.(category)
  const handleRemove = (e: React.MouseEvent) => { e.stopPropagation(); onRemove?.(category) }

  return (
    <span
      data-testid="vendor-category-tag"
      data-size={size}
      data-category={category}
      onClick={handleClick}
      style={{
        ...SIZE_STYLES[size],
        backgroundColor: color,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
      }}
    >
      <span data-testid="category-tag-label">{category}</span>
      {onRemove && (
        <button
          data-testid="category-tag-remove"
          onClick={handleRemove}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', lineHeight: '1', fontSize: 'inherit' }}
          aria-label={`Remove ${category}`}
        >
          ×
        </button>
      )}
    </span>
  )
}

export default VendorCategoryTag

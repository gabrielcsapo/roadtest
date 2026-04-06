import React from 'react'

export type InputType = 'text' | 'email' | 'password' | 'number' | 'search'
export type InputSize = 'sm' | 'md' | 'lg'

export interface InputProps {
  type?: InputType
  placeholder?: string
  value?: string | number
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
  error?: string
  label?: string
  hint?: string
  prefix?: React.ReactNode
  suffix?: React.ReactNode
  size?: InputSize
  className?: string
  'data-testid'?: string
  id?: string
}

const sizeStyles: Record<InputSize, React.CSSProperties> = {
  sm: { fontSize: '12px', padding: '6px 10px', height: '32px' },
  md: { fontSize: '14px', padding: '8px 12px', height: '38px' },
  lg: { fontSize: '16px', padding: '10px 16px', height: '44px' },
}

export const Input: React.FC<InputProps> = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  disabled = false,
  error,
  label,
  hint,
  prefix,
  suffix,
  size = 'md',
  className,
  'data-testid': testId = 'input',
  id,
}) => {
  const inputId = id || testId

  const wrapperStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    width: '100%',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 500,
    color: '#c0c0d0',
  }

  const inputWrapperStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#1e1e2e',
    border: `1px solid ${error ? '#ef4444' : '#3a3a4a'}`,
    borderRadius: '6px',
    overflow: 'hidden',
    opacity: disabled ? 0.6 : 1,
  }

  const inputStyle: React.CSSProperties = {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#e0e0f0',
    fontFamily: 'inherit',
    ...sizeStyles[size],
  }

  const affixStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: '0 10px',
    color: '#6b6b8a',
    backgroundColor: '#16162a',
    height: '100%',
  }

  const hintStyle: React.CSSProperties = {
    fontSize: '11px',
    color: error ? '#f87171' : '#6b6b8a',
  }

  return (
    <div style={wrapperStyle} className={className} data-testid={`${testId}-wrapper`}>
      {label && (
        <label htmlFor={inputId} style={labelStyle} data-testid={`${testId}-label`}>
          {label}
        </label>
      )}
      <div style={inputWrapperStyle} data-testid={`${testId}-container`}>
        {prefix && (
          <span style={affixStyle} data-testid={`${testId}-prefix`}>
            {prefix}
          </span>
        )}
        <input
          id={inputId}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          style={inputStyle}
          data-testid={testId}
          aria-invalid={!!error}
          aria-describedby={hint || error ? `${inputId}-hint` : undefined}
        />
        {suffix && (
          <span style={affixStyle} data-testid={`${testId}-suffix`}>
            {suffix}
          </span>
        )}
      </div>
      {(hint || error) && (
        <span id={`${inputId}-hint`} style={hintStyle} data-testid={`${testId}-hint`}>
          {error || hint}
        </span>
      )}
    </div>
  )
}

export default Input

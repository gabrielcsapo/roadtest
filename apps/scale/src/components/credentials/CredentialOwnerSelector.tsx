import React, { useState } from 'react'
import { User } from '../../types'
import { Avatar } from '../ui/Avatar'
import { Spinner } from '../ui/Spinner'

interface CredentialOwnerSelectorProps {
  users: User[]
  value?: User
  onChange: (user: User | undefined) => void
  loading?: boolean
  error?: string
}

export function CredentialOwnerSelector({
  users,
  value,
  onChange,
  loading = false,
  error,
}: CredentialOwnerSelectorProps) {
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = (user: User) => {
    onChange(user)
    setIsOpen(false)
    setSearch('')
  }

  const handleClear = () => {
    onChange(undefined)
    setSearch('')
  }

  const toggleOpen = () => setIsOpen((o) => !o)

  if (loading) {
    return (
      <div
        data-testid="owner-selector-loading"
        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', background: '#f9fafb' }}
      >
        <Spinner size="sm" />
        <span style={{ fontSize: '14px', color: '#6b7280' }}>Loading users...</span>
      </div>
    )
  }

  return (
    <div data-testid="owner-selector" style={{ position: 'relative' }}>
      <div
        data-testid="owner-trigger"
        onClick={toggleOpen}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 12px',
          border: `1px solid ${error ? '#dc2626' : '#d1d5db'}`,
          borderRadius: '6px',
          background: '#fff',
          cursor: 'pointer',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {value ? (
            <>
              <Avatar name={value.name} src={value.avatarUrl} size={24} />
              <div>
                <div data-testid="selected-user-name" style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>
                  {value.name}
                </div>
                <div data-testid="selected-user-email" style={{ fontSize: '12px', color: '#6b7280' }}>
                  {value.email}
                </div>
              </div>
            </>
          ) : (
            <span data-testid="no-user-placeholder" style={{ fontSize: '14px', color: '#9ca3af' }}>
              Select owner...
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {value && (
            <button
              data-testid="clear-owner-btn"
              onClick={(e) => { e.stopPropagation(); handleClear() }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '16px', padding: '2px 4px' }}
            >
              ×
            </button>
          )}
          <span style={{ color: '#9ca3af', fontSize: '12px' }}>{isOpen ? '▲' : '▼'}</span>
        </div>
      </div>

      {error && (
        <div data-testid="owner-error" style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>
          {error}
        </div>
      )}

      {isOpen && (
        <div
          data-testid="owner-dropdown"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: '#fff',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
            zIndex: 20,
            maxHeight: '280px',
            overflow: 'auto',
          }}
        >
          <div style={{ padding: '8px' }}>
            <input
              data-testid="owner-search-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '4px',
                border: '1px solid #e5e7eb',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {users.length === 0 ? (
            <div data-testid="no-users-message" style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#9ca3af' }}>
              No users available
            </div>
          ) : filtered.length === 0 ? (
            <div data-testid="no-results-message" style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#9ca3af' }}>
              No users match your search
            </div>
          ) : (
            <div style={{ padding: '4px 0' }}>
              {filtered.map((user) => (
                <div
                  key={user.id}
                  data-testid={`user-option-${user.id}`}
                  onClick={() => handleSelect(user)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    cursor: 'pointer',
                    background: value?.id === user.id ? '#eff6ff' : 'transparent',
                  }}
                >
                  <Avatar name={user.name} src={user.avatarUrl} size={28} />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>{user.name}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{user.email}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

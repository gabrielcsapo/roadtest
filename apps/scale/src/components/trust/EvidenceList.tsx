import React from 'react'
import { Button } from '../ui/Button'
import { EmptyState } from '../ui/EmptyState'
import { Tooltip } from '../ui/Tooltip'

interface EvidenceListProps {
  evidence: string[]
  onUpload?: () => void
  onDelete?: (file: string) => void
  onPreview?: (file: string) => void
  readonly?: boolean
}

function getFileIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  if (['pdf'].includes(ext)) return '📄'
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) return '🖼️'
  if (['doc', 'docx'].includes(ext)) return '📝'
  if (['xls', 'xlsx', 'csv'].includes(ext)) return '📊'
  if (['zip', 'tar', 'gz'].includes(ext)) return '📦'
  return '📁'
}

function getFileType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  return ext.toUpperCase() || 'FILE'
}

export function EvidenceList({ evidence, onUpload, onDelete, onPreview, readonly = false }: EvidenceListProps) {
  return (
    <div data-testid="evidence-list-container" data-count={evidence.length} data-readonly={readonly}>
      <div data-testid="evidence-list-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
          Evidence Files ({evidence.length})
        </h4>
        {!readonly && onUpload && (
          <Button
            data-testid="upload-button"
            variant="secondary"
            size="sm"
            onClick={onUpload}
          >
            Upload
          </Button>
        )}
      </div>

      {evidence.length === 0 ? (
        <EmptyState
          data-testid="evidence-empty"
          title="No evidence files"
          description={readonly ? 'No evidence has been uploaded.' : 'Upload evidence files to support this control.'}
        />
      ) : (
        <ul data-testid="evidence-file-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {evidence.map((file) => (
            <li
              key={file}
              data-testid={`evidence-item-${file}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 0',
                borderBottom: '1px solid #f3f4f6',
              }}
            >
              <span data-testid={`file-icon-${file}`} style={{ fontSize: '1.25rem' }}>
                {getFileIcon(file)}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Tooltip content={file}>
                  <span
                    data-testid={`file-name-${file}`}
                    style={{
                      fontSize: '0.875rem',
                      color: '#374151',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'block',
                    }}
                  >
                    {file}
                  </span>
                </Tooltip>
                <span data-testid={`file-type-${file}`} style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                  {getFileType(file)}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                {onPreview && (
                  <Button
                    data-testid={`preview-button-${file}`}
                    variant="ghost"
                    size="sm"
                    onClick={() => onPreview(file)}
                  >
                    Preview
                  </Button>
                )}
                {!readonly && onDelete && (
                  <Button
                    data-testid={`delete-button-${file}`}
                    variant="danger"
                    size="sm"
                    onClick={() => onDelete(file)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

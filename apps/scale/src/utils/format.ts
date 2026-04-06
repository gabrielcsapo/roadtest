/**
 * Formats an ISO date string to a human-readable date string.
 * e.g. "2024-01-15T00:00:00Z" -> "Jan 15, 2024"
 */
export function formatDate(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/**
 * Formats an ISO date string to a relative time string.
 * e.g. "3 days ago"
 */
export function formatRelativeTime(iso: string): string {
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diffMs = now - then
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  const diffWeek = Math.floor(diffDay / 7)
  const diffMonth = Math.floor(diffDay / 30)
  const diffYear = Math.floor(diffDay / 365)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`
  if (diffHour < 24) return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`
  if (diffWeek < 4) return `${diffWeek} week${diffWeek === 1 ? '' : 's'} ago`
  if (diffMonth < 12) return `${diffMonth} month${diffMonth === 1 ? '' : 's'} ago`
  return `${diffYear} year${diffYear === 1 ? '' : 's'} ago`
}

/**
 * Formats a number as currency.
 * e.g. formatCurrency(1234.56) -> "$1,234.56"
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Formats a number as a percentage string.
 * e.g. formatPercentage(87.5) -> "87.5%"
 */
export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Truncates a string to a maximum length, appending "…" if truncated.
 */
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen) + '…'
}

/**
 * Returns a pluralized string based on count.
 * e.g. pluralize(1, 'item') -> "1 item", pluralize(2, 'item') -> "2 items"
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  const pluralForm = plural ?? `${singular}s`
  return `${count} ${count === 1 ? singular : pluralForm}`
}

/**
 * Formats a file size in bytes to a human-readable string.
 * e.g. formatFileSize(1234567) -> "1.2 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  const mb = kb / 1024
  if (mb < 1024) return `${mb.toFixed(1)} MB`
  const gb = mb / 1024
  return `${gb.toFixed(1)} GB`
}

/**
 * Formats a number with thousands separators.
 * e.g. formatNumber(1234567) -> "1,234,567"
 */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n)
}

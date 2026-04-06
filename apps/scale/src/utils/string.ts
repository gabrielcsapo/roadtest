export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/ /g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0)
    .map(word => word[0].toUpperCase())
    .join('')
}

export function capitalize(s: string): string {
  if (!s) return ''
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

export function camelToTitle(s: string): string {
  return s
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim()
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '')
}

export function countWords(s: string): number {
  if (!s.trim()) return 0
  return s.trim().split(/\s+/).length
}

export function padStart(s: string, len: number, char = ' '): string {
  const padChar = char.charAt(0) || ' '
  if (s.length >= len) return s
  return padChar.repeat(len - s.length) + s
}

export function repeat(s: string, n: number): string {
  if (n <= 0) return ''
  return s.repeat(n)
}

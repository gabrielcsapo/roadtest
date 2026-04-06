export function tokenize(query: string): string[] {
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(t => t.length > 0)
}

export function matchesSearch(
  item: Record<string, unknown>,
  fields: string[],
  query: string
): boolean {
  if (!query.trim()) return true
  const tokens = tokenize(query)
  return tokens.every(token =>
    fields.some(field => {
      const val = item[field]
      if (val === null || val === undefined) return false
      return String(val).toLowerCase().includes(token)
    })
  )
}

export function highlightMatch(text: string, query: string): string {
  if (!query.trim()) return text
  const tokens = tokenize(query)
  let result = text
  for (const token of tokens) {
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`(${escaped})`, 'gi')
    result = result.replace(regex, '<mark>$1</mark>')
  }
  return result
}

export function scoreMatch(text: string, query: string): number {
  if (!query.trim()) return 0
  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase().trim()
  if (lowerText === lowerQuery) return 100
  if (lowerText.startsWith(lowerQuery)) return 80
  const tokens = tokenize(query)
  let score = 0
  for (const token of tokens) {
    if (lowerText.includes(token)) {
      score += 50 / tokens.length
    }
  }
  return score
}

export function searchItems<T extends Record<string, unknown>>(
  items: T[],
  fields: (keyof T)[],
  query: string
): T[] {
  if (!query.trim()) return items
  return items.filter(item =>
    matchesSearch(item as Record<string, unknown>, fields as string[], query)
  )
}

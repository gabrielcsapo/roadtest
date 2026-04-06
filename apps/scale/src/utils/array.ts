export function groupBy<T extends Record<string, unknown>>(
  arr: T[],
  key: keyof T
): Record<string, T[]> {
  return arr.reduce<Record<string, T[]>>((acc, item) => {
    const k = String(item[key])
    acc[k] = acc[k] ?? []
    acc[k].push(item)
    return acc
  }, {})
}

export function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)]
}

export function uniqueBy<T extends Record<string, unknown>>(arr: T[], key: keyof T): T[] {
  const seen = new Set<unknown>()
  return arr.filter(item => {
    const val = item[key]
    if (seen.has(val)) return false
    seen.add(val)
    return true
  })
}

export function chunk<T>(arr: T[], size: number): T[][] {
  if (size <= 0) return []
  const result: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size))
  }
  return result
}

export function flatten<T>(arr: T[][]): T[] {
  return ([] as T[]).concat(...arr)
}

export function intersection<T>(a: T[], b: T[]): T[] {
  const setB = new Set(b)
  return a.filter(item => setB.has(item))
}

export function difference<T>(a: T[], b: T[]): T[] {
  const setB = new Set(b)
  return a.filter(item => !setB.has(item))
}

export function countBy<T extends Record<string, unknown>>(
  arr: T[],
  key: keyof T
): Record<string, number> {
  return arr.reduce<Record<string, number>>((acc, item) => {
    const k = String(item[key])
    acc[k] = (acc[k] ?? 0) + 1
    return acc
  }, {})
}

export function sumBy<T extends Record<string, unknown>>(arr: T[], key: keyof T): number {
  return arr.reduce((sum, item) => sum + (Number(item[key]) || 0), 0)
}

export function maxBy<T extends Record<string, unknown>>(arr: T[], key: keyof T): T | undefined {
  if (arr.length === 0) return undefined
  return arr.reduce((max, item) => (Number(item[key]) > Number(max[key]) ? item : max))
}

export function minBy<T extends Record<string, unknown>>(arr: T[], key: keyof T): T | undefined {
  if (arr.length === 0) return undefined
  return arr.reduce((min, item) => (Number(item[key]) < Number(min[key]) ? item : min))
}

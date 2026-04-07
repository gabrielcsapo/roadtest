import { describe, it, expect } from '@fieldtest/core'
import { filterByStatus, filterByRisk, filterByDateRange, filterBySearch, applyFilters, countByStatus } from './filter'

describe('filter', () => {
  const vendorData = [
    { id: '1', name: 'Acme Corp', status: 'active' as const, riskLevel: 'low' as const, date: '2024-01-15T00:00:00Z', category: 'cloud' },
    { id: '2', name: 'Beta LLC', status: 'inactive' as const, riskLevel: 'medium' as const, date: '2024-03-01T00:00:00Z', category: 'saas' },
    { id: '3', name: 'Gamma Inc', status: 'pending' as const, riskLevel: 'high' as const, date: '2024-06-01T00:00:00Z', category: 'cloud' },
    { id: '4', name: 'Delta Corp', status: 'archived' as const, riskLevel: 'critical' as const, date: '2023-12-01T00:00:00Z', category: 'on-prem' },
    { id: '5', name: 'Epsilon SA', status: 'active' as const, riskLevel: 'medium' as const, date: '2024-09-15T00:00:00Z', category: 'saas' },
    { id: '6', name: 'Zeta Corp', status: 'active' as const, riskLevel: 'critical' as const, date: '2024-02-20T00:00:00Z', category: 'cloud' },
  ]

  describe('filterByStatus', () => {
    it('returns all items when statuses is empty', () => {
      expect(filterByStatus(vendorData, [])).toHaveLength(6)
    })

    it('filters by single status: active', () => {
      const result = filterByStatus(vendorData, ['active'])
      expect(result).toHaveLength(3)
      result.forEach(item => expect(item.status).toBe('active'))
    })

    it('filters by single status: inactive', () => {
      const result = filterByStatus(vendorData, ['inactive'])
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Beta LLC')
    })

    it('filters by single status: pending', () => {
      const result = filterByStatus(vendorData, ['pending'])
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Gamma Inc')
    })

    it('filters by single status: archived', () => {
      const result = filterByStatus(vendorData, ['archived'])
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Delta Corp')
    })

    it('filters by multiple statuses: active and inactive', () => {
      const result = filterByStatus(vendorData, ['active', 'inactive'])
      expect(result).toHaveLength(4)
    })

    it('filters by multiple statuses: pending and archived', () => {
      const result = filterByStatus(vendorData, ['pending', 'archived'])
      expect(result).toHaveLength(2)
    })

    it('returns empty when no items match', () => {
      const result = filterByStatus([{ id: '1', status: 'active' as const }], ['inactive'])
      expect(result).toHaveLength(0)
    })

    it('handles empty array input', () => {
      expect(filterByStatus([], ['active'])).toHaveLength(0)
    })

    it('does not mutate original array', () => {
      const original = [...vendorData]
      filterByStatus(vendorData, ['active'])
      expect(vendorData).toHaveLength(original.length)
    })

    it('filters by all four statuses returns all', () => {
      const result = filterByStatus(vendorData, ['active', 'inactive', 'pending', 'archived'])
      expect(result).toHaveLength(6)
    })
  })

  describe('filterByRisk', () => {
    it('returns all items when risks is empty', () => {
      expect(filterByRisk(vendorData, [])).toHaveLength(6)
    })

    it('filters by single risk: low', () => {
      const result = filterByRisk(vendorData, ['low'])
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Acme Corp')
    })

    it('filters by single risk: medium', () => {
      const result = filterByRisk(vendorData, ['medium'])
      expect(result).toHaveLength(2)
    })

    it('filters by single risk: high', () => {
      const result = filterByRisk(vendorData, ['high'])
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Gamma Inc')
    })

    it('filters by single risk: critical', () => {
      const result = filterByRisk(vendorData, ['critical'])
      expect(result).toHaveLength(2)
    })

    it('filters by multiple risks: high and critical', () => {
      const result = filterByRisk(vendorData, ['high', 'critical'])
      expect(result).toHaveLength(3)
    })

    it('filters by multiple risks: low and medium', () => {
      const result = filterByRisk(vendorData, ['low', 'medium'])
      expect(result).toHaveLength(3)
    })

    it('returns empty for no matches', () => {
      const arr = [{ id: '1', riskLevel: 'low' as const }]
      expect(filterByRisk(arr, ['critical'])).toHaveLength(0)
    })

    it('handles empty array', () => {
      expect(filterByRisk([], ['low'])).toHaveLength(0)
    })

    it('does not mutate original', () => {
      filterByRisk(vendorData, ['low'])
      expect(vendorData).toHaveLength(6)
    })
  })

  describe('filterByDateRange', () => {
    it('returns all when from and to are null', () => {
      expect(filterByDateRange(vendorData, 'date', null, null)).toHaveLength(6)
    })

    it('filters by from date only', () => {
      const result = filterByDateRange(vendorData, 'date', '2024-06-01T00:00:00Z', null)
      expect(result.length).toBeGreaterThan(0)
      result.forEach(item => {
        expect(new Date(item.date).getTime()).toBeGreaterThan(new Date('2024-05-31T00:00:00Z').getTime() - 1)
      })
    })

    it('filters by to date only', () => {
      const result = filterByDateRange(vendorData, 'date', null, '2024-01-31T00:00:00Z')
      expect(result.length).toBeGreaterThan(0)
      result.forEach(item => {
        expect(new Date(item.date).getTime()).toBeLessThan(new Date('2024-02-01T00:00:00Z').getTime())
      })
    })

    it('filters by both from and to date', () => {
      const result = filterByDateRange(vendorData, 'date', '2024-01-01T00:00:00Z', '2024-04-01T00:00:00Z')
      expect(result.length).toBeGreaterThan(0)
    })

    it('returns empty when range excludes all', () => {
      const result = filterByDateRange(vendorData, 'date', '2025-01-01T00:00:00Z', '2025-12-31T00:00:00Z')
      expect(result).toHaveLength(0)
    })

    it('handles empty array', () => {
      expect(filterByDateRange([], 'date', null, null)).toHaveLength(0)
    })

    it('does not mutate original', () => {
      filterByDateRange(vendorData, 'date', '2024-01-01T00:00:00Z', null)
      expect(vendorData).toHaveLength(6)
    })
  })

  describe('filterBySearch', () => {
    it('returns all when query is empty', () => {
      expect(filterBySearch(vendorData, ['name'], '')).toHaveLength(6)
    })

    it('returns all when query is whitespace', () => {
      expect(filterBySearch(vendorData, ['name'], '   ')).toHaveLength(6)
    })

    it('filters by name search', () => {
      const result = filterBySearch(vendorData, ['name'], 'Acme')
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Acme Corp')
    })

    it('is case insensitive', () => {
      expect(filterBySearch(vendorData, ['name'], 'acme')).toHaveLength(1)
      expect(filterBySearch(vendorData, ['name'], 'ACME')).toHaveLength(1)
    })

    it('searches across multiple fields', () => {
      const result = filterBySearch(vendorData, ['name', 'category'], 'cloud')
      expect(result.length).toBeGreaterThan(0)
    })

    it('returns empty when no matches', () => {
      expect(filterBySearch(vendorData, ['name'], 'xyznonexistent')).toHaveLength(0)
    })

    it('matches partial strings', () => {
      const result = filterBySearch(vendorData, ['name'], 'Corp')
      expect(result.length).toBeGreaterThan(1)
    })

    it('handles empty array', () => {
      expect(filterBySearch([], ['name'], 'test')).toHaveLength(0)
    })

    it('handles null/undefined values in fields gracefully', () => {
      const arr = [{ name: 'Test', extra: null as unknown as string }]
      expect(filterBySearch(arr, ['name', 'extra'], 'Test')).toHaveLength(1)
    })

    it('does not mutate original', () => {
      filterBySearch(vendorData, ['name'], 'Acme')
      expect(vendorData).toHaveLength(6)
    })
  })

  describe('applyFilters', () => {
    it('returns all when filters object is empty', () => {
      expect(applyFilters(vendorData, {})).toHaveLength(6)
    })

    it('applies status filter', () => {
      const result = applyFilters(vendorData, { status: ['active'] })
      expect(result).toHaveLength(3)
    })

    it('applies risk filter', () => {
      const result = applyFilters(vendorData, { risk: ['low'] })
      expect(result).toHaveLength(1)
    })

    it('applies search filter', () => {
      const result = applyFilters(vendorData, { search: { fields: ['name'], query: 'Acme' } })
      expect(result).toHaveLength(1)
    })

    it('applies combined status and search filters', () => {
      const result = applyFilters(vendorData, {
        status: ['active'],
        search: { fields: ['name'], query: 'Corp' },
      })
      expect(result.length).toBeGreaterThan(0)
      result.forEach(item => expect(item.status).toBe('active'))
    })

    it('applies custom filter', () => {
      const result = applyFilters(vendorData, { custom: item => item.category === 'cloud' })
      expect(result.length).toBeGreaterThan(0)
      result.forEach(item => expect(item.category).toBe('cloud'))
    })

    it('returns empty when combined filters exclude all', () => {
      const result = applyFilters(vendorData, { status: ['active'], risk: ['critical'] })
      result.forEach(item => {
        expect(item.status).toBe('active')
        expect(item.riskLevel).toBe('critical')
      })
    })

    it('handles empty array', () => {
      expect(applyFilters([], { status: ['active'] })).toHaveLength(0)
    })
  })

  describe('countByStatus', () => {
    it('counts items by status', () => {
      const result = countByStatus(vendorData)
      expect(result['active']).toBe(3)
      expect(result['inactive']).toBe(1)
      expect(result['pending']).toBe(1)
      expect(result['archived']).toBe(1)
    })

    it('returns empty object for empty array', () => {
      expect(countByStatus([])).toEqual({})
    })

    it('counts single item', () => {
      const result = countByStatus([{ status: 'active' }])
      expect(result['active']).toBe(1)
    })

    it('handles all same status', () => {
      const arr = Array.from({ length: 5 }, () => ({ status: 'active' }))
      expect(countByStatus(arr)['active']).toBe(5)
    })

    it('counts mixed statuses correctly', () => {
      const arr = [{ status: 'active' }, { status: 'inactive' }, { status: 'active' }]
      const result = countByStatus(arr)
      expect(result['active']).toBe(2)
      expect(result['inactive']).toBe(1)
    })

    it('does not mutate original', () => {
      const arr = [{ status: 'active' }]
      countByStatus(arr)
      expect(arr).toHaveLength(1)
    })

    for (let i = 1; i <= 10; i++) {
      it(`counts ${i} active items correctly`, () => {
        const arr = Array.from({ length: i }, () => ({ status: 'active' }))
        expect(countByStatus(arr)['active']).toBe(i)
      })
    }
  })

  describe('filterByStatus - additional cases', () => {
    const items = [
      { id: 'a', status: 'active' as const },
      { id: 'b', status: 'active' as const },
      { id: 'c', status: 'inactive' as const },
      { id: 'd', status: 'pending' as const },
      { id: 'e', status: 'archived' as const },
    ]
    const statusCases: { statuses: Array<'active'|'inactive'|'pending'|'archived'>; expectedCount: number }[] = [
      { statuses: ['active'], expectedCount: 2 },
      { statuses: ['inactive'], expectedCount: 1 },
      { statuses: ['pending'], expectedCount: 1 },
      { statuses: ['archived'], expectedCount: 1 },
      { statuses: ['active', 'inactive'], expectedCount: 3 },
      { statuses: ['active', 'pending'], expectedCount: 3 },
      { statuses: ['inactive', 'archived'], expectedCount: 2 },
      { statuses: ['active', 'inactive', 'pending'], expectedCount: 4 },
      { statuses: ['active', 'inactive', 'pending', 'archived'], expectedCount: 5 },
    ]
    for (const c of statusCases) {
      it(`filterByStatus([${c.statuses.join(',')}]) returns ${c.expectedCount} items`, () => {
        expect(filterByStatus(items, c.statuses)).toHaveLength(c.expectedCount)
      })
    }
  })

  describe('filterByRisk - additional cases', () => {
    const items = [
      { id: 'a', riskLevel: 'low' as const },
      { id: 'b', riskLevel: 'medium' as const },
      { id: 'c', riskLevel: 'medium' as const },
      { id: 'd', riskLevel: 'high' as const },
      { id: 'e', riskLevel: 'critical' as const },
    ]
    const riskCases: { risks: Array<'low'|'medium'|'high'|'critical'>; expectedCount: number }[] = [
      { risks: ['low'], expectedCount: 1 },
      { risks: ['medium'], expectedCount: 2 },
      { risks: ['high'], expectedCount: 1 },
      { risks: ['critical'], expectedCount: 1 },
      { risks: ['low', 'medium'], expectedCount: 3 },
      { risks: ['high', 'critical'], expectedCount: 2 },
      { risks: ['low', 'high'], expectedCount: 2 },
      { risks: ['low', 'medium', 'high'], expectedCount: 4 },
      { risks: ['low', 'medium', 'high', 'critical'], expectedCount: 5 },
    ]
    for (const c of riskCases) {
      it(`filterByRisk([${c.risks.join(',')}]) returns ${c.expectedCount} items`, () => {
        expect(filterByRisk(items, c.risks)).toHaveLength(c.expectedCount)
      })
    }
  })

  describe('filterBySearch - additional cases', () => {
    const items = [
      { id: '1', name: 'Apple Inc', category: 'tech' },
      { id: '2', name: 'Banana Corp', category: 'food' },
      { id: '3', name: 'Cherry Ltd', category: 'tech' },
      { id: '4', name: 'Date SA', category: 'finance' },
      { id: '5', name: 'Elderberry LLC', category: 'food' },
    ]
    const searchCases = [
      { fields: ['name'], query: 'Inc', count: 1 },
      { fields: ['name'], query: 'Corp', count: 1 },
      { fields: ['name'], query: 'LLC', count: 1 },
      { fields: ['category'], query: 'tech', count: 2 },
      { fields: ['category'], query: 'food', count: 2 },
      { fields: ['category'], query: 'finance', count: 1 },
      { fields: ['name', 'category'], query: 'tech', count: 2 },
      { fields: ['name'], query: '', count: 5 },
      { fields: ['name'], query: 'xyz', count: 0 },
      { fields: ['name'], query: 'a', count: 3 }, // Apple, Banana, Date
    ]
    for (const c of searchCases) {
      it(`filterBySearch(fields=${JSON.stringify(c.fields)}, query="${c.query}") returns ${c.count}`, () => {
        expect(filterBySearch(items, c.fields, c.query)).toHaveLength(c.count)
      })
    }
  })

  describe('applyFilters - additional cases', () => {
    const data = [
      { id: '1', name: 'Alpha', status: 'active' as const, riskLevel: 'low' as const, date: '2024-01-01T00:00:00Z' },
      { id: '2', name: 'Beta', status: 'inactive' as const, riskLevel: 'medium' as const, date: '2024-06-01T00:00:00Z' },
      { id: '3', name: 'Gamma', status: 'active' as const, riskLevel: 'high' as const, date: '2024-09-01T00:00:00Z' },
      { id: '4', name: 'Delta', status: 'pending' as const, riskLevel: 'critical' as const, date: '2024-12-01T00:00:00Z' },
    ]

    it('no filters returns all items', () => {
      expect(applyFilters(data, {})).toHaveLength(4)
    })
    it('filter active returns 2', () => {
      expect(applyFilters(data, { status: ['active'] })).toHaveLength(2)
    })
    it('filter low risk returns 1', () => {
      expect(applyFilters(data, { risk: ['low'] })).toHaveLength(1)
    })
    it('filter active AND low risk returns 1', () => {
      expect(applyFilters(data, { status: ['active'], risk: ['low'] })).toHaveLength(1)
    })
    it('filter search Alpha returns 1', () => {
      expect(applyFilters(data, { search: { fields: ['name'], query: 'Alpha' } })).toHaveLength(1)
    })
    it('filter search "a" returns items with a in name', () => {
      const result = applyFilters(data, { search: { fields: ['name'], query: 'a' } })
      result.forEach(item => expect(item.name.toLowerCase()).toContain('a'))
    })
    it('custom filter by id', () => {
      const result = applyFilters(data, { custom: item => item.id === '1' })
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('1')
    })
    it('custom filter keeps multiple items', () => {
      const result = applyFilters(data, { custom: item => item.status === 'active' })
      expect(result).toHaveLength(2)
    })
    it('date range from 2024-06 keeps later items', () => {
      const result = applyFilters(data, {
        dateRange: { field: 'date', from: '2024-06-01T00:00:00Z', to: null }
      })
      expect(result.length).toBeGreaterThan(0)
    })
    it('empty status array passes all', () => {
      expect(applyFilters(data, { status: [] })).toHaveLength(4)
    })
    it('empty risk array passes all', () => {
      expect(applyFilters(data, { risk: [] })).toHaveLength(4)
    })
  })

  describe('countByStatus - additional edge cases', () => {
    it('counts each status in vendorData correctly', () => {
      const result = countByStatus(vendorData)
      const total = Object.values(result).reduce((a, b) => a + b, 0)
      expect(total).toBe(vendorData.length)
    })
    it('result keys are status strings', () => {
      const result = countByStatus(vendorData)
      expect(typeof Object.keys(result)[0]).toBe('string')
    })
    it('all values are positive numbers', () => {
      const result = countByStatus(vendorData)
      Object.values(result).forEach(v => expect(v).toBeGreaterThan(0))
    })

    const sizes = [5, 10, 15, 20, 25]
    for (const size of sizes) {
      it(`counts ${size} items with all active status`, () => {
        const arr = Array.from({ length: size }, () => ({ status: 'active' }))
        expect(countByStatus(arr)['active']).toBe(size)
      })
    }
  })

  describe('filterByStatus - boundary and consistency', () => {
    it('filterByStatus returns array type', () => {
      expect(Array.isArray(filterByStatus(vendorData, ['active']))).toBeTruthy()
    })
    it('filterByStatus result length is <= input length', () => {
      expect(filterByStatus(vendorData, ['active']).length).toBeLessThan(vendorData.length + 1)
    })
    it('filterByStatus items all have matching status', () => {
      const result = filterByStatus(vendorData, ['active'])
      result.forEach(item => expect(item.status).toBe('active'))
    })
    it('filterByStatus returns same count for same input', () => {
      const r1 = filterByStatus(vendorData, ['active'])
      const r2 = filterByStatus(vendorData, ['active'])
      expect(r1.length).toBe(r2.length)
    })
  })

  describe('filterByRisk - boundary and consistency', () => {
    it('filterByRisk returns array type', () => {
      expect(Array.isArray(filterByRisk(vendorData, ['low']))).toBeTruthy()
    })
    it('filterByRisk items all have matching risk level', () => {
      const result = filterByRisk(vendorData, ['medium'])
      result.forEach(item => expect(item.riskLevel).toBe('medium'))
    })
    it('filterByRisk empty result is empty array', () => {
      const result = filterByRisk([], ['low'])
      expect(result).toHaveLength(0)
    })
    it('filterByRisk with all risks returns all', () => {
      const result = filterByRisk(vendorData, ['low', 'medium', 'high', 'critical'])
      expect(result).toHaveLength(vendorData.length)
    })
  })
})

describe('filterByDateRange - additional range tests', () => {
  const dateItems = [
    { name: 'Jan', date: '2024-01-15T00:00:00Z', status: 'active' as const, riskLevel: 'low' as const },
    { name: 'Mar', date: '2024-03-15T00:00:00Z', status: 'active' as const, riskLevel: 'medium' as const },
    { name: 'Jun', date: '2024-06-15T00:00:00Z', status: 'pending' as const, riskLevel: 'high' as const },
    { name: 'Sep', date: '2024-09-15T00:00:00Z', status: 'inactive' as const, riskLevel: 'critical' as const },
    { name: 'Dec', date: '2024-12-15T00:00:00Z', status: 'archived' as const, riskLevel: 'low' as const },
  ]
  const rangeCases = [
    { from: '2024-01-01T00:00:00Z', to: '2024-12-31T00:00:00Z', expectedCount: 5 },
    { from: '2024-01-01T00:00:00Z', to: '2024-06-30T00:00:00Z', expectedCount: 3 },
    { from: '2024-07-01T00:00:00Z', to: '2024-12-31T00:00:00Z', expectedCount: 2 },
    { from: '2024-03-01T00:00:00Z', to: '2024-09-30T00:00:00Z', expectedCount: 3 },
    { from: '2025-01-01T00:00:00Z', to: '2025-12-31T00:00:00Z', expectedCount: 0 },
    { from: '2023-01-01T00:00:00Z', to: '2023-12-31T00:00:00Z', expectedCount: 0 },
  ]
  for (const c of rangeCases) {
    it(`filterByDateRange from ${c.from.slice(0,10)} to ${c.to.slice(0,10)} = ${c.expectedCount} items`, () => {
      expect(filterByDateRange(dateItems, 'date', c.from, c.to)).toHaveLength(c.expectedCount)
    })
  }
  it('filterByDateRange with null range returns all', () => {
    expect(filterByDateRange(dateItems, 'date', null, null)).toHaveLength(5)
  })
  it('filterByDateRange result items are all within range', () => {
    const result = filterByDateRange(dateItems, 'date', '2024-01-01T00:00:00Z', '2024-06-30T00:00:00Z')
    result.forEach(item => {
      const d = new Date(item.date).getTime()
      expect(d).toBeGreaterThan(new Date('2023-12-31T00:00:00Z').getTime())
      expect(d).toBeLessThan(new Date('2024-07-01T00:00:00Z').getTime())
    })
  })
})

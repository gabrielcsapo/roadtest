import { describe, it, expect } from '@fieldtest/core'
import { paginate, getTotalPages, getPageSlice, isValidPage, clampPage, getPageNumbers } from './pagination'

describe('pagination', () => {
  const arr100 = Array.from({ length: 100 }, (_, i) => i + 1)
  const arr10 = Array.from({ length: 10 }, (_, i) => i + 1)
  const arr5 = Array.from({ length: 5 }, (_, i) => i + 1)

  describe('getTotalPages', () => {
    const cases = [
      { total: 100, size: 10, expected: 10 },
      { total: 101, size: 10, expected: 11 },
      { total: 0, size: 10, expected: 0 },
      { total: 1, size: 10, expected: 1 },
      { total: 10, size: 10, expected: 1 },
      { total: 11, size: 10, expected: 2 },
      { total: 50, size: 25, expected: 2 },
      { total: 7, size: 3, expected: 3 },
      { total: 9, size: 3, expected: 3 },
      { total: 9, size: 4, expected: 3 },
      { total: 100, size: 1, expected: 100 },
      { total: 100, size: 100, expected: 1 },
      { total: 100, size: 0, expected: 0 },
      { total: 1, size: 1, expected: 1 },
      { total: 2, size: 2, expected: 1 },
      { total: 3, size: 2, expected: 2 },
    ]
    for (const c of cases) {
      it(`getTotalPages(${c.total}, ${c.size}) = ${c.expected}`, () => {
        expect(getTotalPages(c.total, c.size)).toBe(c.expected)
      })
    }
  })

  describe('getPageSlice', () => {
    const cases = [
      { total: 100, page: 1, size: 10, start: 0, end: 10 },
      { total: 100, page: 2, size: 10, start: 10, end: 20 },
      { total: 100, page: 10, size: 10, start: 90, end: 100 },
      { total: 15, page: 2, size: 10, start: 10, end: 15 },
      { total: 5, page: 1, size: 10, start: 0, end: 5 },
      { total: 0, page: 1, size: 10, start: 0, end: 0 },
      { total: 100, page: 1, size: 25, start: 0, end: 25 },
      { total: 100, page: 4, size: 25, start: 75, end: 100 },
      { total: 7, page: 3, size: 3, start: 6, end: 7 },
    ]
    for (const c of cases) {
      it(`getPageSlice(${c.total}, ${c.page}, ${c.size}) = {start: ${c.start}, end: ${c.end}}`, () => {
        const result = getPageSlice(c.total, c.page, c.size)
        expect(result.start).toBe(c.start)
        expect(result.end).toBe(c.end)
      })
    }
  })

  describe('isValidPage', () => {
    const validCases = [
      { page: 1, total: 100, size: 10 },
      { page: 5, total: 100, size: 10 },
      { page: 10, total: 100, size: 10 },
      { page: 1, total: 0, size: 10 },
      { page: 1, total: 1, size: 10 },
      { page: 2, total: 11, size: 10 },
      { page: 1, total: 50, size: 25 },
      { page: 2, total: 50, size: 25 },
    ]
    for (const c of validCases) {
      it(`isValidPage(${c.page}, ${c.total}, ${c.size}) = true`, () => {
        expect(isValidPage(c.page, c.total, c.size)).toBeTruthy()
      })
    }

    const invalidCases = [
      { page: 0, total: 100, size: 10 },
      { page: -1, total: 100, size: 10 },
      { page: 11, total: 100, size: 10 },
      { page: 3, total: 20, size: 10 },
      { page: 2, total: 0, size: 10 },
    ]
    for (const c of invalidCases) {
      it(`isValidPage(${c.page}, ${c.total}, ${c.size}) = false`, () => {
        expect(isValidPage(c.page, c.total, c.size)).toBeFalsy()
      })
    }
  })

  describe('clampPage', () => {
    const cases = [
      { page: 1, total: 100, size: 10, expected: 1 },
      { page: 5, total: 100, size: 10, expected: 5 },
      { page: 10, total: 100, size: 10, expected: 10 },
      { page: 11, total: 100, size: 10, expected: 10 },
      { page: 0, total: 100, size: 10, expected: 1 },
      { page: -5, total: 100, size: 10, expected: 1 },
      { page: 100, total: 100, size: 10, expected: 10 },
      { page: 1, total: 0, size: 10, expected: 1 },
      { page: 3, total: 20, size: 10, expected: 2 },
    ]
    for (const c of cases) {
      it(`clampPage(${c.page}, ${c.total}, ${c.size}) = ${c.expected}`, () => {
        expect(clampPage(c.page, c.total, c.size)).toBe(c.expected)
      })
    }
  })

  describe('paginate', () => {
    it('returns first page of items', () => {
      const result = paginate(arr100, 1, 10)
      expect(result.items).toHaveLength(10)
      expect(result.items[0]).toBe(1)
      expect(result.items[9]).toBe(10)
    })

    it('returns second page of items', () => {
      const result = paginate(arr100, 2, 10)
      expect(result.items[0]).toBe(11)
      expect(result.items[9]).toBe(20)
    })

    it('returns correct total', () => {
      expect(paginate(arr100, 1, 10).total).toBe(100)
    })

    it('returns correct page number', () => {
      expect(paginate(arr100, 3, 10).page).toBe(3)
    })

    it('returns correct pageSize', () => {
      expect(paginate(arr100, 1, 10).pageSize).toBe(10)
    })

    it('returns correct totalPages', () => {
      expect(paginate(arr100, 1, 10).totalPages).toBe(10)
    })

    it('last page may have fewer items', () => {
      const result = paginate(arr10, 2, 7)
      expect(result.items).toHaveLength(3)
    })

    it('clamps page to valid range', () => {
      const result = paginate(arr10, 99, 10)
      expect(result.page).toBe(1)
    })

    it('handles empty array', () => {
      const result = paginate([], 1, 10)
      expect(result.items).toHaveLength(0)
      expect(result.total).toBe(0)
      expect(result.totalPages).toBe(0)
    })

    it('handles page size larger than array', () => {
      const result = paginate(arr5, 1, 20)
      expect(result.items).toHaveLength(5)
    })

    for (let page = 1; page <= 10; page++) {
      it(`paginate(arr100, ${page}, 10) returns page ${page}`, () => {
        const result = paginate(arr100, page, 10)
        expect(result.page).toBe(page)
        expect(result.items).toHaveLength(10)
        expect(result.items[0]).toBe((page - 1) * 10 + 1)
      })
    }
  })

  describe('getPageNumbers', () => {
    it('returns [1] for total=1', () => {
      const result = getPageNumbers(1, 1)
      expect(result).toContain(1)
    })

    it('returns empty array for total=0', () => {
      expect(getPageNumbers(1, 0)).toHaveLength(0)
    })

    it('always includes first page', () => {
      const result = getPageNumbers(5, 10)
      expect(result[0]).toBe(1)
    })

    it('always includes last page', () => {
      const result = getPageNumbers(5, 10)
      expect(result[result.length - 1]).toBe(10)
    })

    it('includes current page in result', () => {
      const result = getPageNumbers(5, 10)
      expect(result).toContain(5)
    })

    it('uses ellipsis for large gaps', () => {
      const result = getPageNumbers(5, 20)
      expect(result).toContain('...')
    })

    it('includes pages near current', () => {
      const result = getPageNumbers(10, 20, 2)
      expect(result).toContain(8)
      expect(result).toContain(9)
      expect(result).toContain(10)
      expect(result).toContain(11)
      expect(result).toContain(12)
    })

    it('handles current=1', () => {
      const result = getPageNumbers(1, 10)
      expect(result[0]).toBe(1)
    })

    it('handles current=last', () => {
      const result = getPageNumbers(10, 10)
      expect(result[result.length - 1]).toBe(10)
    })

    it('returns array type', () => {
      expect(Array.isArray(getPageNumbers(1, 5))).toBeTruthy()
    })
    it('total=2 returns [1,2]', () => {
      const result = getPageNumbers(1, 2)
      expect(result).toContain(1)
      expect(result).toContain(2)
    })
    it('total=3 all pages included', () => {
      const result = getPageNumbers(2, 3)
      expect(result).toContain(1)
      expect(result).toContain(2)
      expect(result).toContain(3)
    })
  })

  describe('getTotalPages - additional cases', () => {
    const additionalCases = [
      { total: 99, size: 10, expected: 10 },
      { total: 100, size: 100, expected: 1 },
      { total: 201, size: 100, expected: 3 },
      { total: 1, size: 1, expected: 1 },
      { total: 999, size: 100, expected: 10 },
      { total: 1000, size: 100, expected: 10 },
      { total: 1001, size: 100, expected: 11 },
    ]
    for (const c of additionalCases) {
      it(`getTotalPages(${c.total}, ${c.size}) = ${c.expected}`, () => {
        expect(getTotalPages(c.total, c.size)).toBe(c.expected)
      })
    }
  })

  describe('isValidPage - additional cases', () => {
    const validAdditional = [
      { page: 1, total: 50, size: 10 },
      { page: 5, total: 50, size: 10 },
      { page: 1, total: 100, size: 100 },
      { page: 3, total: 30, size: 10 },
    ]
    for (const c of validAdditional) {
      it(`isValidPage(${c.page}, ${c.total}, ${c.size}) is valid`, () => {
        expect(isValidPage(c.page, c.total, c.size)).toBeTruthy()
      })
    }
    const invalidAdditional = [
      { page: 6, total: 50, size: 10 },
      { page: 2, total: 100, size: 100 },
      { page: 4, total: 30, size: 10 },
    ]
    for (const c of invalidAdditional) {
      it(`isValidPage(${c.page}, ${c.total}, ${c.size}) is invalid`, () => {
        expect(isValidPage(c.page, c.total, c.size)).toBeFalsy()
      })
    }
  })

  describe('clampPage - additional cases', () => {
    const clampCases = [
      { page: 3, total: 50, size: 10, expected: 3 },
      { page: 99, total: 50, size: 10, expected: 5 },
      { page: -99, total: 50, size: 10, expected: 1 },
      { page: 5, total: 50, size: 10, expected: 5 },
      { page: 6, total: 50, size: 10, expected: 5 },
    ]
    for (const c of clampCases) {
      it(`clampPage(${c.page}, ${c.total}, ${c.size}) = ${c.expected}`, () => {
        expect(clampPage(c.page, c.total, c.size)).toBe(c.expected)
      })
    }
  })

  describe('paginate - additional cases', () => {
    const paginateCases = [
      { size: 5, page: 1, firstItem: 1, count: 5 },
      { size: 5, page: 2, firstItem: 6, count: 5 },
      { size: 5, page: 3, firstItem: 11, count: 5 },
      { size: 5, page: 20, firstItem: 96, count: 5 },
      { size: 7, page: 1, firstItem: 1, count: 7 },
      { size: 7, page: 2, firstItem: 8, count: 7 },
      { size: 25, page: 1, firstItem: 1, count: 25 },
      { size: 25, page: 4, firstItem: 76, count: 25 },
    ]
    for (const c of paginateCases) {
      it(`paginate(arr100, ${c.page}, ${c.size}) first=${c.firstItem} count=${c.count}`, () => {
        const result = paginate(arr100, c.page, c.size)
        expect(result.items[0]).toBe(c.firstItem)
        expect(result.items).toHaveLength(c.count)
      })
    }
  })

  describe('getTotalPages - comprehensive coverage', () => {
    for (let size = 1; size <= 10; size++) {
      it(`getTotalPages(100, ${size}) = ${Math.ceil(100 / size)}`, () => {
        expect(getTotalPages(100, size)).toBe(Math.ceil(100 / size))
      })
    }
    it('getTotalPages returns 0 when total is 0', () => {
      expect(getTotalPages(0, 10)).toBe(0)
    })
    it('getTotalPages returns 0 when size is 0', () => {
      expect(getTotalPages(100, 0)).toBe(0)
    })
  })

  describe('clampPage - comprehensive coverage', () => {
    for (let page = 1; page <= 10; page++) {
      it(`clampPage(${page}, 100, 10) = ${page} (valid page)`, () => {
        expect(clampPage(page, 100, 10)).toBe(page)
      })
    }
    for (let page = 11; page <= 20; page++) {
      it(`clampPage(${page}, 100, 10) = 10 (beyond last page)`, () => {
        expect(clampPage(page, 100, 10)).toBe(10)
      })
    }
  })

  describe('getPageSlice - comprehensive coverage', () => {
    for (let page = 1; page <= 10; page++) {
      it(`getPageSlice(100, ${page}, 10) has start=${(page - 1) * 10}`, () => {
        const result = getPageSlice(100, page, 10)
        expect(result.start).toBe((page - 1) * 10)
      })
    }
  })
})

describe('paginate - all 10 pages of arr100 by 10', () => {
  const arr100 = Array.from({ length: 100 }, (_, i) => i + 1)
  const pageCases = Array.from({ length: 10 }, (_, i) => ({
    page: i + 1,
    firstItem: i * 10 + 1,
    lastItem: (i + 1) * 10,
  }))
  for (const c of pageCases) {
    it(`page ${c.page} of 100 items (size 10) starts at ${c.firstItem}`, () => {
      const result = paginate(arr100, c.page, 10)
      expect(result.items[0]).toBe(c.firstItem)
    })
    it(`page ${c.page} of 100 items (size 10) ends at ${c.lastItem}`, () => {
      const result = paginate(arr100, c.page, 10)
      expect(result.items[result.items.length - 1]).toBe(c.lastItem)
    })
    it(`page ${c.page} of 100 items (size 10) has 10 items`, () => {
      const result = paginate(arr100, c.page, 10)
      expect(result.items).toHaveLength(10)
    })
  }
})

describe('getTotalPages - size=1 gives total items as pages', () => {
  const countCases = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000]
  for (const n of countCases) {
    it(`getTotalPages(${n}, 1) = ${n}`, () => {
      expect(getTotalPages(n, 1)).toBe(n)
    })
  }
})

describe('isValidPage - page 1 is always valid', () => {
  const totalCases = [1, 5, 10, 20, 50, 100]
  for (const total of totalCases) {
    it(`page 1 is valid for total=${total}, size=10`, () => {
      expect(isValidPage(1, total, 10)).toBeTruthy()
    })
  }
})

describe('getPageSlice - start and end correctness', () => {
  const sliceCases = [
    { total: 50, page: 1, size: 10, start: 0, end: 10 },
    { total: 50, page: 2, size: 10, start: 10, end: 20 },
    { total: 50, page: 3, size: 10, start: 20, end: 30 },
    { total: 50, page: 4, size: 10, start: 30, end: 40 },
    { total: 50, page: 5, size: 10, start: 40, end: 50 },
    { total: 7, page: 1, size: 3, start: 0, end: 3 },
    { total: 7, page: 2, size: 3, start: 3, end: 6 },
    { total: 7, page: 3, size: 3, start: 6, end: 7 },
    { total: 25, page: 1, size: 25, start: 0, end: 25 },
    { total: 0, page: 1, size: 10, start: 0, end: 0 },
  ]
  for (const c of sliceCases) {
    it(`getPageSlice(${c.total}, ${c.page}, ${c.size}) start=${c.start}, end=${c.end}`, () => {
      const result = getPageSlice(c.total, c.page, c.size)
      expect(result.start).toBe(c.start)
      expect(result.end).toBe(c.end)
    })
  }
})

describe('clampPage - specific values', () => {
  const clampSpecific = [
    { page: 1, total: 100, size: 10, expected: 1 },
    { page: 5, total: 100, size: 10, expected: 5 },
    { page: 10, total: 100, size: 10, expected: 10 },
    { page: 11, total: 100, size: 10, expected: 10 },
    { page: 100, total: 100, size: 10, expected: 10 },
    { page: 0, total: 100, size: 10, expected: 1 },
    { page: -10, total: 100, size: 10, expected: 1 },
    { page: 1, total: 50, size: 25, expected: 1 },
    { page: 2, total: 50, size: 25, expected: 2 },
    { page: 3, total: 50, size: 25, expected: 2 },
  ]
  for (const c of clampSpecific) {
    it(`clampPage(${c.page}, ${c.total}, ${c.size}) = ${c.expected}`, () => {
      expect(clampPage(c.page, c.total, c.size)).toBe(c.expected)
    })
  }
})

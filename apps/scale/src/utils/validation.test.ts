import { describe, it, expect } from '@viewtest/core'
import {
  isValidEmail,
  isValidUrl,
  isRequired,
  minLength,
  maxLength,
  isAlphanumeric,
  isNumeric,
  matchesPattern,
  validateField,
} from './validation'

describe('validation', () => {
  describe('isValidEmail', () => {
    const validEmails = [
      'user@example.com',
      'user.name@domain.org',
      'user+tag@example.co.uk',
      'test123@test.io',
      'admin@company.net',
      'hello@world.dev',
      'a@b.co',
      'first.last@subdomain.example.com',
      'email@domain.museum',
      'test@domain.name',
    ]
    for (const email of validEmails) {
      it(`accepts valid email: ${email}`, () => {
        expect(isValidEmail(email)).toBeTruthy()
      })
    }

    const invalidEmails = [
      '',
      'notanemail',
      '@example.com',
      'user@',
      'user@domain',
      'user name@example.com',
      'user@@example.com',
      'user@.com',
      '.user@example.com',
      'user@example.',
    ]
    for (const email of invalidEmails) {
      it(`rejects invalid email: "${email}"`, () => {
        expect(isValidEmail(email)).toBeFalsy()
      })
    }
  })

  describe('isValidUrl', () => {
    const validUrls = [
      'http://example.com',
      'https://example.com',
      'https://www.example.com/path',
      'https://subdomain.example.com',
      'http://localhost:3000',
      'https://example.com/path?query=1',
      'https://example.com/#anchor',
      'https://api.example.com/v1/users',
      'http://192.168.1.1',
      'https://example.co.uk',
    ]
    for (const url of validUrls) {
      it(`accepts valid URL: ${url}`, () => {
        expect(isValidUrl(url)).toBeTruthy()
      })
    }

    const invalidUrls = [
      '',
      'notaurl',
      'ftp://example.com',
      'example.com',
      '//example.com',
      'javascript:alert(1)',
      'mailto:user@example.com',
    ]
    for (const url of invalidUrls) {
      it(`rejects invalid URL: "${url}"`, () => {
        expect(isValidUrl(url)).toBeFalsy()
      })
    }
  })

  describe('isRequired', () => {
    const requiredCases = [
      { value: 'hello', expected: true },
      { value: '  text  ', expected: true },
      { value: '0', expected: true },
      { value: 0, expected: true },
      { value: false, expected: true },
      { value: [], expected: true },
      { value: {}, expected: true },
      { value: 1, expected: true },
    ]
    for (const c of requiredCases) {
      it(`isRequired returns ${c.expected} for ${JSON.stringify(c.value)}`, () => {
        if (c.expected) {
          expect(isRequired(c.value)).toBeTruthy()
        } else {
          expect(isRequired(c.value)).toBeFalsy()
        }
      })
    }

    const emptyCases = [null, undefined, '']
    for (const v of emptyCases) {
      it(`isRequired returns false for ${JSON.stringify(v)}`, () => {
        expect(isRequired(v)).toBeFalsy()
      })
    }

    it('isRequired returns false for whitespace-only string', () => {
      expect(isRequired('   ')).toBeFalsy()
    })
  })

  describe('minLength', () => {
    const cases = [
      { s: 'hello', min: 3, expected: true },
      { s: 'hi', min: 3, expected: false },
      { s: 'exactly', min: 7, expected: true },
      { s: '', min: 0, expected: true },
      { s: '', min: 1, expected: false },
      { s: 'abc', min: 3, expected: true },
      { s: 'ab', min: 3, expected: false },
      { s: 'a'.repeat(100), min: 100, expected: true },
      { s: 'a'.repeat(99), min: 100, expected: false },
      { s: 'test', min: 1, expected: true },
      { s: 'test', min: 5, expected: false },
      { s: 'password123', min: 8, expected: true },
    ]
    for (const c of cases) {
      it(`minLength("${c.s.slice(0, 10)}", ${c.min}) is ${c.expected}`, () => {
        if (c.expected) {
          expect(minLength(c.s, c.min)).toBeTruthy()
        } else {
          expect(minLength(c.s, c.min)).toBeFalsy()
        }
      })
    }
  })

  describe('maxLength', () => {
    const cases = [
      { s: 'hello', max: 10, expected: true },
      { s: 'hello world extra text', max: 10, expected: false },
      { s: 'exactly10!', max: 10, expected: true },
      { s: 'exactly10!!', max: 10, expected: false },
      { s: '', max: 0, expected: true },
      { s: 'a', max: 0, expected: false },
      { s: 'short', max: 255, expected: true },
      { s: 'a'.repeat(100), max: 100, expected: true },
      { s: 'a'.repeat(101), max: 100, expected: false },
    ]
    for (const c of cases) {
      it(`maxLength("${c.s.slice(0, 10)}...", ${c.max}) is ${c.expected}`, () => {
        if (c.expected) {
          expect(maxLength(c.s, c.max)).toBeTruthy()
        } else {
          expect(maxLength(c.s, c.max)).toBeFalsy()
        }
      })
    }
  })

  describe('isAlphanumeric', () => {
    const validCases = ['abc', 'ABC', '123', 'abc123', 'ABC123', 'a1b2c3', 'A1', 'z9']
    for (const s of validCases) {
      it(`isAlphanumeric("${s}") is true`, () => {
        expect(isAlphanumeric(s)).toBeTruthy()
      })
    }
    const invalidCases = ['', 'hello world', 'abc!', 'abc-123', 'abc_123', 'abc.def', '123@']
    for (const s of invalidCases) {
      it(`isAlphanumeric("${s}") is false`, () => {
        expect(isAlphanumeric(s)).toBeFalsy()
      })
    }
  })

  describe('isNumeric', () => {
    const validCases = ['0', '123', '-123', '1.5', '-1.5', '0.001', '999999']
    for (const s of validCases) {
      it(`isNumeric("${s}") is true`, () => {
        expect(isNumeric(s)).toBeTruthy()
      })
    }
    const invalidCases = ['', 'abc', '1.2.3', '1e5', '--1', '1-', '1.', '.5', '1 2']
    for (const s of invalidCases) {
      it(`isNumeric("${s}") is false`, () => {
        expect(isNumeric(s)).toBeFalsy()
      })
    }
  })

  describe('matchesPattern', () => {
    const cases = [
      { s: 'hello', regex: /hello/, expected: true },
      { s: 'hello world', regex: /^hello/, expected: true },
      { s: 'world hello', regex: /^hello/, expected: false },
      { s: 'ABC123', regex: /^[A-Z]+\d+$/, expected: true },
      { s: 'abc123', regex: /^[A-Z]+\d+$/, expected: false },
      { s: '2024-01-15', regex: /^\d{4}-\d{2}-\d{2}$/, expected: true },
      { s: '01/15/2024', regex: /^\d{4}-\d{2}-\d{2}$/, expected: false },
      { s: '+1-555-1234', regex: /^\+\d{1,3}-\d{3}-\d{4}$/, expected: true },
    ]
    for (const c of cases) {
      it(`matchesPattern("${c.s}", ${c.regex}) is ${c.expected}`, () => {
        if (c.expected) {
          expect(matchesPattern(c.s, c.regex)).toBeTruthy()
        } else {
          expect(matchesPattern(c.s, c.regex)).toBeFalsy()
        }
      })
    }
  })

  describe('validateField', () => {
    it('returns null when no rules', () => {
      expect(validateField('anything', [])).toBeNull()
    })
    it('returns error for required with empty string', () => {
      expect(validateField('', [{ type: 'required' }])).toBe('This field is required')
    })
    it('returns null for required with non-empty string', () => {
      expect(validateField('hello', [{ type: 'required' }])).toBeNull()
    })
    it('returns error for invalid email', () => {
      expect(validateField('notanemail', [{ type: 'email' }])).toBe('Invalid email address')
    })
    it('returns null for valid email', () => {
      expect(validateField('user@example.com', [{ type: 'email' }])).toBeNull()
    })
    it('returns error for invalid url', () => {
      expect(validateField('notaurl', [{ type: 'url' }])).toBe('Invalid URL')
    })
    it('returns null for valid url', () => {
      expect(validateField('https://example.com', [{ type: 'url' }])).toBeNull()
    })
    it('returns error for minLength violation', () => {
      expect(validateField('hi', [{ type: 'minLength', min: 5 }])).toBe('Minimum length is 5')
    })
    it('returns null for minLength satisfied', () => {
      expect(validateField('hello', [{ type: 'minLength', min: 5 }])).toBeNull()
    })
    it('returns error for maxLength violation', () => {
      expect(validateField('toolong', [{ type: 'maxLength', max: 3 }])).toBe('Maximum length is 3')
    })
    it('returns null for maxLength satisfied', () => {
      expect(validateField('ok', [{ type: 'maxLength', max: 3 }])).toBeNull()
    })
    it('returns error for non-alphanumeric', () => {
      expect(validateField('hello!', [{ type: 'alphanumeric' }])).toBe('Only letters and numbers are allowed')
    })
    it('returns null for alphanumeric', () => {
      expect(validateField('hello123', [{ type: 'alphanumeric' }])).toBeNull()
    })
    it('returns error for non-numeric', () => {
      expect(validateField('abc', [{ type: 'numeric' }])).toBe('Must be a number')
    })
    it('returns null for numeric string', () => {
      expect(validateField('123', [{ type: 'numeric' }])).toBeNull()
    })
    it('returns error for pattern mismatch with default message', () => {
      expect(validateField('abc', [{ type: 'pattern', regex: /^\d+$/ }])).toBe('Invalid format')
    })
    it('returns error for pattern mismatch with custom message', () => {
      expect(validateField('abc', [{ type: 'pattern', regex: /^\d+$/, message: 'Digits only' }])).toBe('Digits only')
    })
    it('returns null for pattern match', () => {
      expect(validateField('123', [{ type: 'pattern', regex: /^\d+$/ }])).toBeNull()
    })
    it('stops at first failing rule in multiple rules', () => {
      const rules = [{ type: 'required' as const }, { type: 'email' as const }]
      expect(validateField('', rules)).toBe('This field is required')
    })
    it('checks second rule when first passes', () => {
      const rules = [{ type: 'required' as const }, { type: 'email' as const }]
      expect(validateField('notanemail', rules)).toBe('Invalid email address')
    })
    it('returns null when all rules pass', () => {
      const rules = [
        { type: 'required' as const },
        { type: 'email' as const },
        { type: 'maxLength' as const, max: 100 },
      ]
      expect(validateField('user@example.com', rules)).toBeNull()
    })
  })

  describe('isValidEmail - additional edge cases', () => {
    const moreValidEmails = [
      'user123@example.com',
      'user.name+tag@domain.co.uk',
      'test@subdomain.example.org',
      'a@b.io',
      'hello123@world456.net',
      'Test.User@Example.COM',
      'user_name@domain.info',
      'user-name@domain.biz',
    ]
    for (const email of moreValidEmails) {
      it(`accepts additional valid email: ${email}`, () => {
        expect(isValidEmail(email)).toBeTruthy()
      })
    }
    const moreInvalidEmails = [
      'missing@tld.',
      'spaces in@email.com',
      'double@@at.com',
      'nodomain@',
      '@nodomain.com',
    ]
    for (const email of moreInvalidEmails) {
      it(`rejects additional invalid email: "${email}"`, () => {
        expect(isValidEmail(email)).toBeFalsy()
      })
    }
  })

  describe('isValidUrl - additional cases', () => {
    const moreValidUrls = [
      'https://example.com/path/to/page',
      'http://example.com/search?q=test&page=1',
      'https://example.com/path#section',
      'https://user:pass@example.com',
      'https://example.com:8080/path',
      'http://subdomain.sub2.example.co.uk',
    ]
    for (const url of moreValidUrls) {
      it(`accepts additional valid URL: ${url}`, () => {
        expect(isValidUrl(url)).toBeTruthy()
      })
    }
    const moreInvalidUrls = [
      'www.example.com',
      'example',
      'file:///etc/passwd',
      'data:text/html,test',
    ]
    for (const url of moreInvalidUrls) {
      it(`rejects additional invalid URL: "${url}"`, () => {
        expect(isValidUrl(url)).toBeFalsy()
      })
    }
  })

  describe('minLength - additional cases', () => {
    const minLengthCases = [
      { s: 'hello', min: 0, expected: true },
      { s: '', min: 0, expected: true },
      { s: 'a', min: 1, expected: true },
      { s: 'ab', min: 2, expected: true },
      { s: 'abc', min: 4, expected: false },
      { s: 'password123', min: 8, expected: true },
      { s: 'pass', min: 8, expected: false },
    ]
    for (const c of minLengthCases) {
      it(`minLength("${c.s.slice(0,10)}", ${c.min}) = ${c.expected}`, () => {
        if (c.expected) {
          expect(minLength(c.s, c.min)).toBeTruthy()
        } else {
          expect(minLength(c.s, c.min)).toBeFalsy()
        }
      })
    }
  })

  describe('maxLength - additional cases', () => {
    const maxLengthCases = [
      { s: '', max: 0, expected: true },
      { s: 'a', max: 1, expected: true },
      { s: 'ab', max: 1, expected: false },
      { s: 'test', max: 4, expected: true },
      { s: 'tests', max: 4, expected: false },
      { s: 'a'.repeat(255), max: 255, expected: true },
      { s: 'a'.repeat(256), max: 255, expected: false },
    ]
    for (const c of maxLengthCases) {
      it(`maxLength("${c.s.slice(0,10)}...", ${c.max}) = ${c.expected}`, () => {
        if (c.expected) {
          expect(maxLength(c.s, c.max)).toBeTruthy()
        } else {
          expect(maxLength(c.s, c.max)).toBeFalsy()
        }
      })
    }
  })

  describe('isAlphanumeric - additional cases', () => {
    const alphanumCases = [
      { s: 'helloworld', expected: true },
      { s: 'HELLOWORLD', expected: true },
      { s: 'Hello123', expected: true },
      { s: '12345', expected: true },
      { s: 'hello world', expected: false },
      { s: 'hello-world', expected: false },
      { s: 'hello_world', expected: false },
      { s: '!hello', expected: false },
    ]
    for (const c of alphanumCases) {
      it(`isAlphanumeric("${c.s}") = ${c.expected}`, () => {
        if (c.expected) {
          expect(isAlphanumeric(c.s)).toBeTruthy()
        } else {
          expect(isAlphanumeric(c.s)).toBeFalsy()
        }
      })
    }
  })

  describe('isNumeric - additional cases', () => {
    const numericCases = [
      { s: '0', expected: true },
      { s: '42', expected: true },
      { s: '-42', expected: true },
      { s: '3.14', expected: true },
      { s: '-3.14', expected: true },
      { s: '1000000', expected: true },
      { s: 'abc', expected: false },
      { s: '12abc', expected: false },
      { s: '1.2.3', expected: false },
    ]
    for (const c of numericCases) {
      it(`isNumeric("${c.s}") = ${c.expected}`, () => {
        if (c.expected) {
          expect(isNumeric(c.s)).toBeTruthy()
        } else {
          expect(isNumeric(c.s)).toBeFalsy()
        }
      })
    }
  })
})

describe('validateField - comprehensive rule combinations', () => {
  const emailRuleCases = [
    { value: 'a@b.com', rules: [{ type: 'required' as const }, { type: 'email' as const }], expected: null },
    { value: '', rules: [{ type: 'required' as const }, { type: 'email' as const }], expected: 'This field is required' },
    { value: 'notEmail', rules: [{ type: 'required' as const }, { type: 'email' as const }], expected: 'Invalid email address' },
    { value: 'user@example.com', rules: [{ type: 'email' as const }, { type: 'maxLength' as const, max: 50 }], expected: null },
    { value: 'hi', rules: [{ type: 'minLength' as const, min: 5 }], expected: 'Minimum length is 5' },
    { value: 'hello', rules: [{ type: 'minLength' as const, min: 5 }], expected: null },
    { value: 'hello!', rules: [{ type: 'alphanumeric' as const }], expected: 'Only letters and numbers are allowed' },
    { value: 'hello', rules: [{ type: 'alphanumeric' as const }], expected: null },
    { value: '123', rules: [{ type: 'numeric' as const }], expected: null },
    { value: 'abc', rules: [{ type: 'numeric' as const }], expected: 'Must be a number' },
    { value: 'test', rules: [{ type: 'maxLength' as const, max: 10 }], expected: null },
    { value: 'a very long string', rules: [{ type: 'maxLength' as const, max: 5 }], expected: 'Maximum length is 5' },
    { value: '', rules: [], expected: null },
    { value: 'abc', rules: [{ type: 'pattern' as const, regex: /^[a-z]+$/ }], expected: null },
    { value: 'ABC', rules: [{ type: 'pattern' as const, regex: /^[a-z]+$/ }], expected: 'Invalid format' },
    { value: '   ', rules: [{ type: 'required' as const }], expected: 'This field is required' },
    { value: 'x'.repeat(100), rules: [{ type: 'maxLength' as const, max: 99 }], expected: 'Maximum length is 99' },
    { value: 'x'.repeat(99), rules: [{ type: 'maxLength' as const, max: 99 }], expected: null },
    { value: 'x'.repeat(8), rules: [{ type: 'minLength' as const, min: 8 }], expected: null },
    { value: 'x'.repeat(7), rules: [{ type: 'minLength' as const, min: 8 }], expected: 'Minimum length is 8' },
    { value: 'https://example.com', rules: [{ type: 'url' as const }], expected: null },
    { value: 'notaurl', rules: [{ type: 'url' as const }], expected: 'Invalid URL' },
    { value: 'abc123', rules: [{ type: 'alphanumeric' as const }], expected: null },
    { value: 'abc 123', rules: [{ type: 'alphanumeric' as const }], expected: 'Only letters and numbers are allowed' },
    { value: '-1.5', rules: [{ type: 'numeric' as const }], expected: null },
    { value: '1.2.3', rules: [{ type: 'numeric' as const }], expected: 'Must be a number' },
    { value: 'test@example.com', rules: [{ type: 'email' as const }], expected: null },
    { value: '@example.com', rules: [{ type: 'email' as const }], expected: 'Invalid email address' },
    { value: 'ftp://bad.com', rules: [{ type: 'url' as const }], expected: 'Invalid URL' },
    { value: 'A1B2C3', rules: [{ type: 'alphanumeric' as const }], expected: null },
  ]
  for (const c of emailRuleCases) {
    it(`validateField("${c.value.slice(0,15)}", [${c.rules.map(r => r.type).join(',')}]) = ${JSON.stringify(c.expected)}`, () => {
      expect(validateField(c.value, c.rules)).toBe(c.expected)
    })
  }
})

describe('isRequired - more edge cases', () => {
  const trueCases = [' a ', 'false', '0', '  hello', 'true', '[]', '{}', 'null', 'undefined', 'NaN']
  for (const v of trueCases) {
    it(`isRequired("${v}") is true (non-empty string)`, () => {
      expect(isRequired(v)).toBeTruthy()
    })
  }
  const falseCases = ['', '   ', '\t', '\n', '  \t  ']
  for (const v of falseCases) {
    it(`isRequired("${v.replace(/\s/g, ' ')}") is false (whitespace/empty)`, () => {
      expect(isRequired(v)).toBeFalsy()
    })
  }
})

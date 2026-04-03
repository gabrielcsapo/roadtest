/**
 * Pure logic tests — no render() call, no component.
 * These run identically in the browser and in Node.
 */
import { describe, it, expect } from '../framework'

function clamp(val: number, min: number, max: number) {
  return Math.min(Math.max(val, min), max)
}

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
}

describe('clamp()', () => {
  it('returns value when in range', () => {
    expect(clamp(5, 0, 10)).toBe(5)
  })

  it('clamps to min', () => {
    expect(clamp(-5, 0, 10)).toBe(0)
  })

  it('clamps to max', () => {
    expect(clamp(20, 0, 10)).toBe(10)
  })
})

describe('slugify()', () => {
  it('lowercases', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('replaces spaces with hyphens', () => {
    expect(slugify('foo bar baz')).toBe('foo-bar-baz')
  })

  it('strips special characters', () => {
    expect(slugify('Hello, World!')).toBe('hello-world')
  })
})

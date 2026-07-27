import { describe, it, expect, vi } from 'vitest'
import { pathsEqual } from '../pathsEqual'
import { setsEqual } from '../setsEqual'
import { expandInserted } from '../expandInserted'

vi.mock('../../store/jsonStore', () => ({
  useJsonStore: {
    getState: vi.fn(),
  },
}))

import { useJsonStore } from '../../store/jsonStore'

describe('pathsEqual', () => {
  it('returns true for identical empty paths', () => {
    expect(pathsEqual([], [])).toBe(true)
  })

  it('returns true for identical single-segment paths', () => {
    expect(pathsEqual(['foo'], ['foo'])).toBe(true)
  })

  it('returns true for identical multi-segment paths with mixed types', () => {
    expect(pathsEqual(['a', 0, 'b'], ['a', 0, 'b'])).toBe(true)
  })

  it('returns false for different lengths', () => {
    expect(pathsEqual(['a'], ['a', 'b'])).toBe(false)
    expect(pathsEqual(['a', 'b'], ['a'])).toBe(false)
  })

  it('returns false for same length but different segments', () => {
    expect(pathsEqual(['a', 'b'], ['a', 'c'])).toBe(false)
  })

  it('returns false when number vs string segments differ', () => {
    expect(pathsEqual(['0'], [0])).toBe(false)
  })

  it('returns true for deep nested paths', () => {
    const path = ['a', 'b', 'c', 'd', 'e', 0, 1, 2]
    expect(pathsEqual(path, ['a', 'b', 'c', 'd', 'e', 0, 1, 2])).toBe(true)
  })
})

describe('setsEqual', () => {
  it('returns true for identical empty sets', () => {
    expect(setsEqual(new Set(), new Set())).toBe(true)
  })

  it('returns true for same reference', () => {
    const s = new Set(['a', 'b'])
    expect(setsEqual(s, s)).toBe(true)
  })

  it('returns true for sets with same elements in different order', () => {
    expect(setsEqual(new Set(['a', 'b', 'c']), new Set(['c', 'a', 'b']))).toBe(true)
  })

  it('returns false for different sizes', () => {
    expect(setsEqual(new Set(['a']), new Set(['a', 'b']))).toBe(false)
  })

  it('returns false for same size but different elements', () => {
    expect(setsEqual(new Set(['a', 'b']), new Set(['a', 'c']))).toBe(false)
  })

  it('returns true for single-element sets with same element', () => {
    expect(setsEqual(new Set(['x']), new Set(['x']))).toBe(true)
  })
})

describe('expandInserted', () => {
  it('expands newly inserted key in an object', () => {
    const mockJson = { name: 'existing', age: 30 }
    vi.mocked(useJsonStore.getState).mockReturnValue({
      jsonValue: mockJson,
    } as unknown as ReturnType<typeof useJsonStore.getState>)

    const expandPathFn = vi.fn()
    expandInserted([], expandPathFn)

    expect(expandPathFn).toHaveBeenCalledWith(['age'])
  })

  it('expands newly inserted index in an array', () => {
    const mockJson = ['a', 'b', 'c']
    vi.mocked(useJsonStore.getState).mockReturnValue({
      jsonValue: mockJson,
    } as unknown as ReturnType<typeof useJsonStore.getState>)

    const expandPathFn = vi.fn()
    expandInserted([], expandPathFn)

    expect(expandPathFn).toHaveBeenCalledWith([2])
  })

  it('walks nested path before determining key', () => {
    const mockJson = {
      users: {
        name: 'Alice',
      },
    }
    vi.mocked(useJsonStore.getState).mockReturnValue({
      jsonValue: mockJson,
    } as unknown as ReturnType<typeof useJsonStore.getState>)

    const expandPathFn = vi.fn()
    expandInserted(['users'], expandPathFn)

    expect(expandPathFn).toHaveBeenCalledWith(['users', 'name'])
  })

  it('walks nested array path before determining index', () => {
    const mockJson = {
      items: ['x', 'y'],
    }
    vi.mocked(useJsonStore.getState).mockReturnValue({
      jsonValue: mockJson,
    } as unknown as ReturnType<typeof useJsonStore.getState>)

    const expandPathFn = vi.fn()
    expandInserted(['items'], expandPathFn)

    expect(expandPathFn).toHaveBeenCalledWith(['items', 1])
  })
})

import { describe, it, expect } from 'vitest'
import { JsonTreeService } from '../JsonTreeService'
import type { JsonObject } from '../../types'

const svc = new JsonTreeService()

describe('JsonTreeService', () => {
  describe('isPalettePayload', () => {
    it('returns true for palette payloads', () => {
      expect(svc.isPalettePayload({ fromPalette: true, paletteType: 'string' })).toBe(true)
    })
    it('returns false for node-move payloads', () => {
      expect(svc.isPalettePayload({ fromPath: ['a', 'b'] })).toBe(false)
    })
  })

  describe('isObject / isArray', () => {
    it('isObject returns true for plain objects', () => {
      expect(svc.isObject({})).toBe(true)
      expect(svc.isObject({ a: 1 })).toBe(true)
    })
    it('isObject returns false for arrays, null, primitives', () => {
      expect(svc.isObject([])).toBe(false)
      expect(svc.isObject(null)).toBe(false)
      expect(svc.isObject(42)).toBe(false)
    })
    it('isArray returns true for arrays', () => {
      expect(svc.isArray([])).toBe(true)
      expect(svc.isArray([1, 2])).toBe(true)
    })
    it('isArray returns false for objects, null, primitives', () => {
      expect(svc.isArray({})).toBe(false)
      expect(svc.isArray(null)).toBe(false)
      expect(svc.isArray('hi')).toBe(false)
    })
  })

  describe('getAtPath', () => {
    it('returns root when path is empty', () => {
      const root = { a: 1 }
      expect(svc.getAtPath(root, [])).toEqual(root)
    })
    it('returns nested value', () => {
      const root = { a: { b: { c: 42 } } }
      expect(svc.getAtPath(root, ['a', 'b', 'c'])).toBe(42)
    })
    it('returns array element', () => {
      const root = [10, 20, 30]
      expect(svc.getAtPath(root, [1])).toBe(20)
    })
    it('returns single-segment path', () => {
      const root = { x: 'hello' }
      expect(svc.getAtPath(root, ['x'])).toBe('hello')
    })
  })

  describe('setAtPath', () => {
    it('updates root when path is empty', () => {
      const root = { a: 1 }
      expect(svc.setAtPath(root, [], () => ({ b: 2 }))).toEqual({ b: 2 })
    })
    it('updates nested value immutably', () => {
      const root = { a: { b: 1 } }
      const next = svc.setAtPath(root, ['a', 'b'], () => 99)
      expect(next).toEqual({ a: { b: 99 } })
      expect(root).toEqual({ a: { b: 1 } })
    })
    it('updates deep nesting', () => {
      const root = { a: { b: { c: { d: 'old' } } } }
      const next = svc.setAtPath(root, ['a', 'b', 'c', 'd'], () => 'new')
      expect(next).toEqual({ a: { b: { c: { d: 'new' } } } })
    })
    it('does not mutate original', () => {
      const root = { a: [1, 2] }
      const next = svc.setAtPath(root, ['a', 0], () => 99)
      expect(root.a).toEqual([1, 2])
      expect(next).toEqual({ a: [99, 2] })
    })
  })

  describe('removeAtPath', () => {
    it('returns root when path is empty', () => {
      const root = { a: 1 }
      expect(svc.removeAtPath(root, [])).toEqual(root)
    })
    it('removes key from object', () => {
      const root = { a: 1, b: 2 }
      expect(svc.removeAtPath(root, ['b'])).toEqual({ a: 1 })
    })
    it('removes item from array', () => {
      const root = [10, 20, 30]
      expect(svc.removeAtPath(root, [1])).toEqual([10, 30])
    })
    it('removes first item from array', () => {
      const root = ['a', 'b', 'c']
      expect(svc.removeAtPath(root, [0])).toEqual(['b', 'c'])
    })
  })

  describe('insertAtPath', () => {
    it('appends to array when key is null', () => {
      const root = [1, 2]
      expect(svc.insertAtPath(root, [], null, 3)).toEqual([1, 2, 3])
    })
    it('inserts at specific index in array', () => {
      const root = [1, 3]
      expect(svc.insertAtPath(root, [], 1, 2)).toEqual([1, 2, 3])
    })
    it('inserts at start of array', () => {
      const root = [2, 3]
      expect(svc.insertAtPath(root, [], 0, 1)).toEqual([1, 2, 3])
    })
    it('inserts with insertAfter flag', () => {
      const root = [1, 3]
      expect(svc.insertAtPath(root, [], 0, 2, undefined, true)).toEqual([1, 2, 3])
    })
    it('appends to object when key is null', () => {
      const root = { a: 1 }
      const result = svc.insertAtPath(root, [], null, 2, 'b')
      expect(result).toEqual({ a: 1, b: 2 })
    })
    it('inserts before a key in object', () => {
      const root = { a: 1, c: 3 }
      const result = svc.insertAtPath(root, [], 'c', 2, 'b') as JsonObject
      expect(Object.keys(result)).toEqual(['a', 'b', 'c'])
    })
  })

  describe('isAncestorOrEqual', () => {
    it('returns true for equal paths', () => {
      expect(svc.isAncestorOrEqual(['a', 'b'], ['a', 'b'])).toBe(true)
    })
    it('returns true for ancestor', () => {
      expect(svc.isAncestorOrEqual(['a'], ['a', 'b'])).toBe(true)
    })
    it('returns false for descendant', () => {
      expect(svc.isAncestorOrEqual(['a', 'b'], ['a'])).toBe(false)
    })
    it('returns false for unrelated paths', () => {
      expect(svc.isAncestorOrEqual(['x'], ['a', 'b'])).toBe(false)
    })
    it('returns true for empty ancestor', () => {
      expect(svc.isAncestorOrEqual([], ['a'])).toBe(true)
    })
  })

  describe('isComplexValue', () => {
    it('returns true for objects', () => {
      expect(svc.isComplexValue({})).toBe(true)
    })
    it('returns true for arrays', () => {
      expect(svc.isComplexValue([])).toBe(true)
    })
    it('returns false for string', () => {
      expect(svc.isComplexValue('hello')).toBe(false)
    })
    it('returns false for number', () => {
      expect(svc.isComplexValue(42)).toBe(false)
    })
    it('returns false for boolean', () => {
      expect(svc.isComplexValue(true)).toBe(false)
    })
    it('returns false for null', () => {
      expect(svc.isComplexValue(null)).toBe(false)
    })
  })

  describe('enumerateTargets', () => {
    it('returns root object on empty root', () => {
      const targets = svc.enumerateTargets({})
      expect(targets).toHaveLength(1)
      expect(targets[0]?.kind).toBe('object')
    })
    it('returns nested targets', () => {
      const root = { a: { b: [] } }
      const targets = svc.enumerateTargets(root)
      expect(targets).toHaveLength(3)
      expect(targets.map(t => t.kind)).toEqual(['object', 'object', 'array'])
    })
    it('returns empty array for primitive root', () => {
      expect(svc.enumerateTargets('hello')).toEqual([])
    })
    it('includes array targets', () => {
      const root = [1, { x: 2 }]
      const targets = svc.enumerateTargets(root)
      expect(targets).toHaveLength(2)
      expect(targets[0]?.kind).toBe('array')
      expect(targets[1]?.kind).toBe('object')
    })
  })

  describe('collectComplexKeys', () => {
    it('returns empty for primitives', () => {
      expect(svc.collectComplexKeys('hello', [])).toEqual([])
    })
    it('returns empty for flat object', () => {
      expect(svc.collectComplexKeys({ a: 1, b: 'hi' }, [])).toEqual([])
    })
    it('returns keys for nested objects', () => {
      const root = { a: { b: 1 } }
      const keys = svc.collectComplexKeys(root, [])
      expect(keys).toEqual([JSON.stringify(['a'])])
    })
    it('returns keys for nested arrays', () => {
      const root = [[1], 2]
      const keys = svc.collectComplexKeys(root, [])
      expect(keys).toEqual([JSON.stringify([0])])
    })
    it('returns deeply nested keys', () => {
      const root = { a: { b: { c: 1 } } }
      const keys = svc.collectComplexKeys(root, [])
      expect(keys.length).toBe(2)
    })
  })
})

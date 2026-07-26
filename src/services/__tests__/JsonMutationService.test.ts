import { describe, it, expect } from 'vitest'
import { JsonMutationService } from '../JsonMutationService'
import { JsonTreeService } from '../JsonTreeService'
import type { JsonObject } from '../../types'

const treeSvc = new JsonTreeService()
const svc = new JsonMutationService(treeSvc)

describe('JsonMutationService', () => {
  describe('buildDefaultValue', () => {
    it('returns string value', () => {
      expect(svc.buildDefaultValue({ type: 'string', name: 'f', valueText: 'hi', valueNumber: 0, valueBoolean: false, isNull: false })).toBe('hi')
    })
    it('returns valueText when present (even empty)', () => {
      expect(svc.buildDefaultValue({ type: 'string', name: 'myField', valueText: '', valueNumber: 0, valueBoolean: false, isNull: false })).toBe('')
    })
    it('returns number value', () => {
      expect(svc.buildDefaultValue({ type: 'number', name: 'f', valueText: '', valueNumber: 42, valueBoolean: false, isNull: false })).toBe(42)
    })
    it('returns 0 for non-finite number', () => {
      expect(svc.buildDefaultValue({ type: 'number', name: 'f', valueText: '', valueNumber: NaN, valueBoolean: false, isNull: false })).toBe(0)
    })
    it('returns boolean value', () => {
      expect(svc.buildDefaultValue({ type: 'boolean', name: 'f', valueText: '', valueNumber: 0, valueBoolean: true, isNull: false })).toBe(true)
    })
    it('returns empty object', () => {
      expect(svc.buildDefaultValue({ type: 'object', name: 'f', valueText: '', valueNumber: 0, valueBoolean: false, isNull: false })).toEqual({})
    })
    it('returns empty array', () => {
      expect(svc.buildDefaultValue({ type: 'array', name: 'f', valueText: '', valueNumber: 0, valueBoolean: false, isNull: false })).toEqual([])
    })
    it('returns null when isNull is true', () => {
      expect(svc.buildDefaultValue({ type: 'string', name: 'f', valueText: 'x', valueNumber: 0, valueBoolean: true, isNull: true })).toBeNull()
    })
  })

  describe('moveNode', () => {
    it('reorders within same parent', () => {
      const root = { a: 1, b: 2, c: 3 }
      const result = svc.moveNode(root, { fromPath: ['a'], fromKey: 'a' }, [], 'c') as JsonObject
      expect(Object.keys(result)).toEqual(['b', 'c', 'a'])
    })
    it('moves across parents', () => {
      const root = { a: { x: 1 }, b: {} }
      const result = svc.moveNode(root, { fromPath: ['a', 'x'], fromKey: 'x' }, ['b'], null)
      expect(result).toEqual({ a: {}, b: { x: 1 } })
    })
    it('prevents ancestor-to-descendant move', () => {
      const root = { a: { b: 1 } }
      const result = svc.moveNode(root, { fromPath: ['a'] }, ['a', 'b'], null)
      expect(result).toEqual({ a: { b: 1 } })
    })
    it('returns root for same position', () => {
      const root = { a: 1, b: 2 }
      const result = svc.moveNode(root, { fromPath: ['a'], fromKey: 'a' }, [], 'a')
      expect(result).toBe(root)
    })
    it('returns root for palette payload', () => {
      const root = { a: 1 }
      const result = svc.moveNode(root, { fromPalette: true, paletteType: 'string' }, [], null)
      expect(result).toBe(root)
    })
  })

  describe('insertFromPalette', () => {
    it('inserts string type', () => {
      const root = {}
      const result = svc.insertFromPalette(root, 'string', [], null) as JsonObject
      const keys = Object.keys(result)
      expect(keys).toHaveLength(1)
      expect(result[keys[0]!]).toBe('')
    })
    it('inserts object type', () => {
      const result = svc.insertFromPalette({}, 'object', [], null) as JsonObject
      const keys = Object.keys(result)
      expect(result[keys[0]!]).toEqual({})
    })
    it('inserts array type', () => {
      const result = svc.insertFromPalette({}, 'array', [], null) as JsonObject
      const keys = Object.keys(result)
      expect(result[keys[0]!]).toEqual([])
    })
    it('inserts number type', () => {
      const result = svc.insertFromPalette({}, 'number', [], null) as JsonObject
      const keys = Object.keys(result)
      expect(result[keys[0]!]).toBe(0)
    })
    it('inserts boolean type', () => {
      const result = svc.insertFromPalette({}, 'boolean', [], null) as JsonObject
      const keys = Object.keys(result)
      expect(result[keys[0]!]).toBe(false)
    })
    it('inserts null type', () => {
      const result = svc.insertFromPalette({}, 'null', [], null) as JsonObject
      const keys = Object.keys(result)
      expect(result[keys[0]!]).toBeNull()
    })
  })

  describe('updatePrimitive', () => {
    it('updates at root', () => {
      expect(svc.updatePrimitive('old', [], 'new')).toBe('new')
    })
    it('updates at nested path', () => {
      const root = { a: { b: 1 } }
      expect(svc.updatePrimitive(root, ['a', 'b'], 42)).toEqual({ a: { b: 42 } })
    })
    it('updates array element', () => {
      const root = [1, 2, 3]
      expect(svc.updatePrimitive(root, [1], 99)).toEqual([1, 99, 3])
    })
  })

  describe('applyInsert', () => {
    it('inserts into object target', () => {
      const root = { existing: 1 }
      const target = { label: 'Inicio', path: [], kind: 'object' as const }
      const result = svc.applyInsert(root, target, 'newKey', 'string', { valueText: 'hi', valueNumber: 0, valueBoolean: false, isNull: false })
      expect(result).toEqual({ existing: 1, newKey: 'hi' })
    })
    it('inserts into array target', () => {
      const root = [1, 2]
      const target = { label: 'Inicio', path: [], kind: 'array' as const }
      const result = svc.applyInsert(root, target, '', 'number', { valueText: '', valueNumber: 3, valueBoolean: false, isNull: false })
      expect(result).toEqual([1, 2, 3])
    })
    it('inserts into nested object', () => {
      const root = { a: {} }
      const target = { label: 'Inicio.a', path: ['a'], kind: 'object' as const }
      const result = svc.applyInsert(root, target, 'key', 'boolean', { valueText: '', valueNumber: 0, valueBoolean: true, isNull: false })
      expect(result).toEqual({ a: { key: true } })
    })
  })
})

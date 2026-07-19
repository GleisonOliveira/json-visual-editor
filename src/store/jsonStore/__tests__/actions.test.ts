import { describe, it, expect } from 'vitest'
import { jsonActions } from '../actions'

describe('jsonStore actions', () => {
  describe('setJsonValue', () => {
    it('replaces root', () => {
      const result = jsonActions.setJsonValue({}, () => ({ a: 1 }))
      expect(result).toEqual({ a: 1 })
    })

    it('replaces with updater', () => {
      const result = jsonActions.setJsonValue({ a: 1 }, (prev) => ({ ...prev as Record<string, unknown>, b: 2 }))
      expect(result).toEqual({ a: 1, b: 2 })
    })
  })

  describe('handleUpdate', () => {
    it('updates at root level', () => {
      const result = jsonActions.handleUpdate('old', [], 'new')
      expect(result).toBe('new')
    })

    it('updates at nested path', () => {
      const result = jsonActions.handleUpdate({ a: { b: 1 } }, ['a', 'b'], 42)
      expect(result).toEqual({ a: { b: 42 } })
    })

    it('updates array element', () => {
      const result = jsonActions.handleUpdate([1, 2, 3], [1], 99)
      expect(result).toEqual([1, 99, 3])
    })
  })

  describe('handleMove', () => {
    it('reorders within same parent', () => {
      const root = { a: 1, b: 2, c: 3 }
      const result = jsonActions.handleMove(root, { fromPath: ['a'], fromKey: 'a' }, [], 'c') as Record<string, unknown>
      expect(Object.keys(result)).toEqual(['b', 'c', 'a'])
    })

    it('moves across parents', () => {
      const root = { a: { x: 1 }, b: {} }
      const result = jsonActions.handleMove(root, { fromPath: ['a', 'x'], fromKey: 'x' }, ['b'], null)
      expect(result).toEqual({ a: {}, b: { x: 1 } })
    })

    it('prevents ancestor-to-descendant move', () => {
      const root = { a: { b: 1 } }
      const result = jsonActions.handleMove(root, { fromPath: ['a'] }, ['a', 'b'], null)
      expect(result).toEqual({ a: { b: 1 } })
    })

    it('returns root for same position', () => {
      const root = { a: 1, b: 2 }
      const result = jsonActions.handleMove(root, { fromPath: ['a'], fromKey: 'a' }, [], 'a')
      expect(result).toBe(root)
    })
  })

  describe('handleInsert', () => {
    it('inserts string type', () => {
      const result = jsonActions.handleInsert({}, 'string', [], null) as Record<string, unknown>
      const keys = Object.keys(result)
      expect(keys).toHaveLength(1)
      expect(result[keys[0]!]).toBe('')
    })

    it('inserts object type', () => {
      const result = jsonActions.handleInsert({}, 'object', [], null) as Record<string, unknown>
      const keys = Object.keys(result)
      expect(result[keys[0]!]).toEqual({})
    })

    it('inserts array type', () => {
      const result = jsonActions.handleInsert({}, 'array', [], null) as Record<string, unknown>
      const keys = Object.keys(result)
      expect(result[keys[0]!]).toEqual([])
    })
  })

  describe('handleApplyInsert', () => {
    it('inserts into object target', () => {
      const root = { existing: 1 }
      const target = { label: 'Inicio', path: [], kind: 'object' as const }
      const result = jsonActions.handleApplyInsert(root, target, 'newKey', 'string', { valueText: 'hi', valueNumber: 0, valueBoolean: false, isNull: false })
      expect(result).toEqual({ existing: 1, newKey: 'hi' })
    })

    it('inserts into array target', () => {
      const root = [1, 2]
      const target = { label: 'Inicio', path: [], kind: 'array' as const }
      const result = jsonActions.handleApplyInsert(root, target, '', 'number', { valueText: '', valueNumber: 3, valueBoolean: false, isNull: false })
      expect(result).toEqual([1, 2, 3])
    })

    it('inserts into nested object', () => {
      const root = { a: {} }
      const target = { label: 'Inicio.a', path: ['a'], kind: 'object' as const }
      const result = jsonActions.handleApplyInsert(root, target, 'key', 'boolean', { valueText: '', valueNumber: 0, valueBoolean: true, isNull: false })
      expect(result).toEqual({ a: { key: true } })
    })
  })
})

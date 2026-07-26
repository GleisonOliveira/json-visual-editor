import { describe, it, expect } from 'vitest'
import { JsonValidationService } from '../JsonValidationService'

const svc = new JsonValidationService()

describe('JsonValidationService', () => {
  describe('validateAddFieldForm', () => {
    it('accepts valid string field', () => {
      const result = svc.validateAddFieldForm({
        name: 'myField', type: 'string', isNull: false,
        valueText: 'hello', valueNumberText: '0', valueBoolean: false, parentIsArray: false,
      })
      expect(result.ok).toBe(true)
    })
    it('accepts valid number field', () => {
      const result = svc.validateAddFieldForm({
        name: 'count', type: 'number', isNull: false,
        valueText: '', valueNumberText: '42', valueBoolean: false, parentIsArray: false,
      })
      expect(result.ok).toBe(true)
    })
    it('accepts valid boolean field', () => {
      const result = svc.validateAddFieldForm({
        name: 'flag', type: 'boolean', isNull: false,
        valueText: '', valueNumberText: '0', valueBoolean: true, parentIsArray: false,
      })
      expect(result.ok).toBe(true)
    })
    it('accepts valid object field', () => {
      const result = svc.validateAddFieldForm({
        name: 'nested', type: 'object', isNull: false,
        valueText: '', valueNumberText: '0', valueBoolean: false, parentIsArray: false,
      })
      expect(result.ok).toBe(true)
    })
    it('accepts valid array field', () => {
      const result = svc.validateAddFieldForm({
        name: 'items', type: 'array', isNull: false,
        valueText: '', valueNumberText: '0', valueBoolean: false, parentIsArray: false,
      })
      expect(result.ok).toBe(true)
    })
    it('rejects empty name even when isNull (name always validated for object parent)', () => {
      const result = svc.validateAddFieldForm({
        name: '', type: 'string', isNull: true,
        valueText: '', valueNumberText: '0', valueBoolean: false, parentIsArray: false,
      })
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.nameError).toBe('Informe um nome.')
    })
    it('rejects empty name for object parent', () => {
      const result = svc.validateAddFieldForm({
        name: '', type: 'string', isNull: false,
        valueText: 'x', valueNumberText: '0', valueBoolean: false, parentIsArray: false,
      })
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.nameError).toBe('Informe um nome.')
    })
    it('rejects invalid number value', () => {
      const result = svc.validateAddFieldForm({
        name: 'count', type: 'number', isNull: false,
        valueText: '', valueNumberText: 'abc', valueBoolean: false, parentIsArray: false,
      })
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.valueError).toBeTruthy()
    })
    it('accepts empty name for array parent', () => {
      const result = svc.validateAddFieldForm({
        name: '', type: 'string', isNull: false,
        valueText: 'x', valueNumberText: '0', valueBoolean: false, parentIsArray: true,
      })
      expect(result.ok).toBe(true)
    })
  })

  describe('validateJsonString', () => {
    it('parses valid JSON', () => {
      const result = svc.validateJsonString('{"a": 1}')
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.value).toEqual({ a: 1 })
    })
    it('rejects invalid JSON', () => {
      const result = svc.validateJsonString('{invalid}')
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error).toBeTruthy()
    })
    it('parses empty object', () => {
      const result = svc.validateJsonString('{}')
      expect(result.ok).toBe(true)
    })
    it('parses array', () => {
      const result = svc.validateJsonString('[1, 2, 3]')
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.value).toEqual([1, 2, 3])
    })
  })
})

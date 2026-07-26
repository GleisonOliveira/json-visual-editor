import { describe, it, expect, beforeEach } from 'vitest'
import { useUiStore } from '../index'

beforeEach(() => {
  const { collapseAll, cancelEditing, setToast } = useUiStore.getState()
  collapseAll()
  cancelEditing()
  setToast(null)
  localStorage.clear()
})

describe('uiStore', () => {
  describe('toggleMode', () => {
    it('switches light↔dark', () => {
      const initial = useUiStore.getState().mode
      useUiStore.getState().toggleMode()
      expect(useUiStore.getState().mode).toBe(initial === 'dark' ? 'light' : 'dark')
    })

    it('persists to localStorage', () => {
      useUiStore.getState().toggleMode()
      const next = useUiStore.getState().mode
      expect(localStorage.getItem('color-mode')).toBe(next)
    })
  })

  describe('toggleExpand', () => {
    it('adds a key', () => {
      useUiStore.getState().toggleExpand('["a"]')
      expect(useUiStore.getState().expanded.has('["a"]')).toBe(true)
    })

    it('removes an existing key', () => {
      useUiStore.getState().toggleExpand('["a"]')
      useUiStore.getState().toggleExpand('["a"]')
      expect(useUiStore.getState().expanded.has('["a"]')).toBe(false)
    })
  })

  describe('expandPath', () => {
    it('adds path key', () => {
      useUiStore.getState().expandPath(['a', 'b'])
      expect(useUiStore.getState().expanded.has(JSON.stringify(['a', 'b']))).toBe(true)
    })
  })

  describe('collapseAll', () => {
    it('clears expanded set', () => {
      useUiStore.getState().toggleExpand('["a"]')
      useUiStore.getState().collapseAll()
      expect(useUiStore.getState().expanded.size).toBe(0)
    })
  })

  describe('expandAll', () => {
    it('populates expanded set', () => {
      useUiStore.getState().expandAll(['["a"]', '["b"]'])
      const expanded = useUiStore.getState().expanded
      expect(expanded.size).toBe(2)
      expect(expanded.has('["a"]')).toBe(true)
      expect(expanded.has('["b"]')).toBe(true)
    })
  })

  describe('startEditing', () => {
    it('sets editingJson, editingText, clears error', () => {
      useUiStore.getState().setEditError('old error')
      useUiStore.getState().startEditing('{"key":1}')
      const s = useUiStore.getState()
      expect(s.editingJson).toBe(true)
      expect(s.editingText).toBe('{"key":1}')
      expect(s.editError).toBeNull()
    })
  })

  describe('cancelEditing', () => {
    it('clears editingJson, editingText, editError', () => {
      useUiStore.getState().startEditing('{"key":1}')
      useUiStore.getState().cancelEditing()
      const s = useUiStore.getState()
      expect(s.editingJson).toBe(false)
      expect(s.editingText).toBe('')
      expect(s.editError).toBeNull()
    })
  })

  describe('setToast', () => {
    it('sets toast', () => {
      useUiStore.getState().setToast({ msg: 'ok', severity: 'success' })
      expect(useUiStore.getState().toast).toEqual({ msg: 'ok', severity: 'success' })
    })

    it('clears toast with null', () => {
      useUiStore.getState().setToast({ msg: 'ok', severity: 'success' })
      useUiStore.getState().setToast(null)
      expect(useUiStore.getState().toast).toBeNull()
    })
  })

  describe('form field setters', () => {
    it('setFieldName updates', () => {
      useUiStore.getState().setFieldName('myField')
      expect(useUiStore.getState().fieldName).toBe('myField')
    })

    it('setFieldType updates', () => {
      useUiStore.getState().setFieldType('number')
      expect(useUiStore.getState().fieldType).toBe('number')
    })

    it('setTargetLabel updates', () => {
      useUiStore.getState().setTargetLabel('Inicio.a')
      expect(useUiStore.getState().targetLabel).toBe('Inicio.a')
    })

    it('setValueText updates', () => {
      useUiStore.getState().setValueText('hello')
      expect(useUiStore.getState().valueText).toBe('hello')
    })

    it('setValueNumberText updates', () => {
      useUiStore.getState().setValueNumberText('42')
      expect(useUiStore.getState().valueNumberText).toBe('42')
    })

    it('setValueBoolean updates', () => {
      useUiStore.getState().setValueBoolean(true)
      expect(useUiStore.getState().valueBoolean).toBe(true)
    })

    it('setValueIsNull updates', () => {
      useUiStore.getState().setValueIsNull(true)
      expect(useUiStore.getState().valueIsNull).toBe(true)
    })

    it('setNameError updates', () => {
      useUiStore.getState().setNameError('required')
      expect(useUiStore.getState().nameError).toBe('required')
    })

    it('setValueError updates', () => {
      useUiStore.getState().setValueError('invalid')
      expect(useUiStore.getState().valueError).toBe('invalid')
    })
  })
})

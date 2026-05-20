import { create } from 'zustand'
import type { UiStore } from './types'
import type { FieldType } from '../../types'

function getInitialMode(): 'light' | 'dark' {
  const saved = localStorage.getItem('color-mode')
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const useUiStore = create<UiStore>((set) => ({
  mode: getInitialMode(),
  toggleMode: () =>
    set((s) => {
      const next = s.mode === 'dark' ? 'light' : 'dark'
      localStorage.setItem('color-mode', next)
      return { mode: next }
    }),

  expanded: new Set<string>(),
  toggleExpand: (key) =>
    set((s) => {
      const next = new Set(s.expanded)
      if (next.has(key)) { next.delete(key) } else { next.add(key) }
      return { expanded: next }
    }),
  expandPath: (path) =>
    set((s) => {
      const key = JSON.stringify(path)
      const next = new Set(s.expanded)
      next.add(key)
      return { expanded: next }
    }),
  collapseAll: () => set({ expanded: new Set<string>() }),
  expandAll: (allKeys) => set({ expanded: new Set(allKeys) }),

  editingJson: false,
  editingText: '',
  editError: null,
  setEditingJson: (v) => set({ editingJson: v }),
  setEditingText: (v) => set({ editingText: v }),
  setEditError: (v) => set({ editError: v }),
  startEditing: (json) => set({ editingJson: true, editingText: json, editError: null }),
  cancelEditing: () => set({ editingJson: false, editingText: '', editError: null }),

  toast: null,
  setToast: (t) => set({ toast: t }),

  fieldName: 'newField',
  fieldType: 'string' as FieldType,
  targetLabel: 'Início',
  nameError: null,
  valueError: null,
  valueText: 'item',
  valueNumberText: '0',
  valueBoolean: false,
  valueIsNull: false,
  setFieldName: (v) => set({ fieldName: v }),
  setFieldType: (v) => set({ fieldType: v }),
  setTargetLabel: (v) => set({ targetLabel: v }),
  setNameError: (v) => set({ nameError: v }),
  setValueError: (v) => set({ valueError: v }),
  setValueText: (v) => set({ valueText: v }),
  setValueNumberText: (v) => set({ valueNumberText: v }),
  setValueBoolean: (v) => set({ valueBoolean: v }),
  setValueIsNull: (v) => set({ valueIsNull: v }),
}))

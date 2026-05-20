import type { FieldType } from '../../types'

export type Toast = { msg: string; severity: 'success' | 'error' }

export type UiStore = {
  mode: 'light' | 'dark'
  toggleMode: () => void

  expanded: Set<string>
  toggleExpand: (key: string) => void
  expandPath: (path: Array<string | number>) => void
  collapseAll: () => void
  expandAll: (allKeys: string[]) => void

  editingJson: boolean
  editingText: string
  editError: string | null
  setEditingJson: (v: boolean) => void
  setEditingText: (v: string) => void
  setEditError: (v: string | null) => void
  startEditing: (json: string) => void
  cancelEditing: () => void

  toast: Toast | null
  setToast: (t: Toast | null) => void

  fieldName: string
  fieldType: FieldType
  targetLabel: string
  nameError: string | null
  valueError: string | null
  valueText: string
  valueNumberText: string
  valueBoolean: boolean
  valueIsNull: boolean
  setFieldName: (v: string) => void
  setFieldType: (v: FieldType) => void
  setTargetLabel: (v: string) => void
  setNameError: (v: string | null) => void
  setValueError: (v: string | null) => void
  setValueText: (v: string) => void
  setValueNumberText: (v: string) => void
  setValueBoolean: (v: boolean) => void
  setValueIsNull: (v: boolean) => void
}

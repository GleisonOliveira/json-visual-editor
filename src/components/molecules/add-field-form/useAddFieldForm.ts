import { useCallback, useEffect, useMemo, startTransition } from 'react'
import { z } from 'zod'
import { useUiStore } from '../../../store/uiStore'
import { useJsonStore } from '../../../store/jsonStore'
import { JsonTreeService } from '../../../services/JsonTreeService'
import type { FieldType } from '../../../types'

const treeSvc = new JsonTreeService()

/**
 * Composable for the AddFieldForm molecule.
 * Manages all form state, validation, target computation, and the add action.
 */
export function useAddFieldForm(): {
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
  editingJson: boolean
  targets: ReturnType<typeof treeSvc.enumerateTargets>
  selectedTarget: ReturnType<typeof treeSvc.enumerateTargets>[number] | undefined
  onAdd: () => void
} {
  const {
    fieldName, fieldType, targetLabel, nameError, valueError,
    valueText, valueNumberText, valueBoolean, valueIsNull,
    setFieldName, setFieldType, setTargetLabel, setNameError, setValueError,
    setValueText, setValueNumberText, setValueBoolean, setValueIsNull,
    editingJson,
  } = useUiStore()

  const { jsonValue, handleApplyInsert } = useJsonStore()
  const { expandPath } = useUiStore()

  const targets = useMemo(() => treeSvc.enumerateTargets(jsonValue ?? {}), [jsonValue])

  const selectedTarget = useMemo(
    () => targets.find((t) => t.label === targetLabel) ?? targets[0],
    [targets, targetLabel]
  )

  useEffect(() => {
    if (!targets.find((t) => t.label === targetLabel)) {
      startTransition(() => setTargetLabel(targets[0]?.label ?? 'Início'))
    }
  }, [targets, targetLabel, setTargetLabel])

  useEffect(() => {
    if (selectedTarget?.kind === 'array') startTransition(() => setFieldName(''))
  }, [selectedTarget?.kind, setFieldName])

  const valueNumber = useMemo(() => {
    const n = Number(valueNumberText)

    return Number.isFinite(n) ? n : 0
  }, [valueNumberText])

  const onAdd = useCallback((): void => {
    if (!selectedTarget) return
    setNameError(null)
    setValueError(null)
    const parentIsArray = selectedTarget.kind === 'array'
    const schema = z
      .object({
        name: parentIsArray
          ? z.string().trim().optional()
          : z.string().trim().min(1, 'Informe um nome.'),
        type: z.enum(['string', 'number', 'boolean', 'object', 'array']),
        isNull: z.boolean(),
        valueText: z.string(),
        valueNumberText: z.string(),
        valueBoolean: z.boolean(),
      })
      .superRefine((data, ctx) => {
        if (data.isNull) return
        if (data.type === 'string' && data.valueText.trim().length === 0)
          ctx.addIssue({ code: 'custom', message: 'Informe um valor.' })
        if (data.type === 'number' && !Number.isFinite(Number(data.valueNumberText)))
          ctx.addIssue({ code: 'custom', message: 'Informe um número válido.' })
      })

    const result = schema.safeParse({ name: fieldName, type: fieldType, isNull: valueIsNull, valueText, valueNumberText, valueBoolean })

    if (!result.success) {
      const msg = result.error.issues[0]?.message ?? 'Dados inválidos.'
      if (msg === 'Informe um nome.') setNameError(msg)
      else setValueError(msg)

      return
    }

    setNameError(null)
    setValueError(null)
    handleApplyInsert(selectedTarget, result.data.name ?? '', result.data.type, {
      valueText,
      valueNumber,
      valueBoolean,
      isNull: valueIsNull,
    })
    expandPath(selectedTarget.path)
  }, [selectedTarget, fieldName, fieldType, valueIsNull, valueText, valueNumberText, valueNumber, valueBoolean, setNameError, setValueError, handleApplyInsert, expandPath])

  return {
    fieldName, fieldType, targetLabel, nameError, valueError,
    valueText, valueNumberText, valueBoolean, valueIsNull,
    setFieldName, setFieldType, setTargetLabel, setNameError, setValueError,
    setValueText, setValueNumberText, setValueBoolean, setValueIsNull,
    editingJson, targets, selectedTarget, onAdd,
  }
}

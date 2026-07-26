import { useCallback } from 'react'
import { useMediaQuery, useTheme } from '@mui/material'
import { useUiStore } from '../../../store/uiStore'
import { useJsonStore } from '../../../store/jsonStore'

/**
 * Composable for the JsonToolbar molecule.
 * Provides all toolbar action handlers and responsive state.
 */
export function useJsonToolbar(): {
  editingJson: boolean
  isSmall: boolean
  handleEdit: () => void
  handleCancel: () => void
  handleValidate: () => void
  handleCopy: () => void
  handleCopyMinified: () => void
  handleDownload: () => void
} {
  const { editingJson, editingText, startEditing, cancelEditing, setEditError, setToast } = useUiStore()
  const { jsonValue, setJsonValue } = useJsonStore()
  const theme = useTheme()
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'))
  const jsonStr = JSON.stringify(jsonValue, null, 2)

  const handleEdit = useCallback(() => {
    startEditing(jsonStr)
  }, [startEditing, jsonStr])

  const handleCancel = useCallback(() => {
    cancelEditing()
  }, [cancelEditing])

  const handleValidate = useCallback(() => {
    try {
      const parsed = JSON.parse(editingText) as import('../../../types').JsonValue
      setJsonValue(() => parsed)
      cancelEditing()
      setToast({ msg: 'JSON válido aplicado com sucesso.', severity: 'success' })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'JSON inválido.'
      setEditError(msg)
      setToast({ msg: `JSON inválido: ${msg}`, severity: 'error' })
    }
  }, [editingText, setJsonValue, cancelEditing, setEditError, setToast])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(jsonStr)
      .then(() => setToast({ msg: 'JSON copiado para o clipboard!', severity: 'success' }))
      .catch(() => setToast({ msg: 'Falha ao copiar o JSON.', severity: 'error' }))
  }, [jsonStr, setToast])

  const handleCopyMinified = useCallback(() => {
    navigator.clipboard.writeText(JSON.stringify(jsonValue))
      .then(() => setToast({ msg: 'JSON minificado copiado para o clipboard!', severity: 'success' }))
      .catch(() => setToast({ msg: 'Falha ao copiar o JSON.', severity: 'error' }))
  }, [jsonValue, setToast])

  const handleDownload = useCallback(() => {
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'data.json'
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 100)
    setToast({ msg: 'JSON baixado com sucesso!', severity: 'success' })
  }, [jsonStr, setToast])

  return {
    editingJson, isSmall,
    handleEdit, handleCancel, handleValidate,
    handleCopy, handleCopyMinified, handleDownload,
  }
}

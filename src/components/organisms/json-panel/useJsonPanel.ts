import { useCallback, useMemo } from 'react'
import { useMediaQuery, useTheme } from '@mui/material'
import { useUiStore } from '../../../store/uiStore'
import { useJsonStore } from '../../../store/jsonStore'
import { codeMirrorLightTheme, codeMirrorDarkTheme, codeMirrorLightSyntax, codeMirrorDarkSyntax } from '../../../theme'

/**
 * Composable for the JsonPanel organism.
 * Provides CodeMirror theme configuration, JSON string, and editor change handler.
 */
export function useJsonPanel(): {
  editingJson: boolean
  editingText: string
  editError: string | null
  cmTheme: typeof codeMirrorLightTheme
  cmSyntax: typeof codeMirrorLightSyntax
  jsonStr: string
  handleEditorChange: (val: string) => void
} {
  const { mode, editingJson, editingText, editError, setEditingText, setEditError } = useUiStore()
  const { jsonValue } = useJsonStore()
  const theme = useTheme()
  useMediaQuery(theme.breakpoints.down('sm'))
  const cmTheme = mode === 'dark' ? codeMirrorDarkTheme : codeMirrorLightTheme
  const cmSyntax = mode === 'dark' ? codeMirrorDarkSyntax : codeMirrorLightSyntax
  const jsonStr = useMemo(() => JSON.stringify(jsonValue, null, 2), [jsonValue])

  const handleEditorChange = useCallback(
    (val: string) => { setEditingText(val); setEditError(null) },
    [setEditingText, setEditError]
  )

  return { editingJson, editingText, editError, cmTheme, cmSyntax, jsonStr, handleEditorChange }
}

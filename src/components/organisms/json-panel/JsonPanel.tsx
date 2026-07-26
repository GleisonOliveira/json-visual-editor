import type React from 'react'
import { Box, Card, CardContent, CardHeader, Typography } from '@mui/material'
import CodeMirror from '@uiw/react-codemirror'
import { json } from '@codemirror/lang-json'
import { EditorView } from '@codemirror/view'
import { JsonToolbar } from '../../molecules/json-toolbar/JsonToolbar'
import { useJsonPanel } from './useJsonPanel'

const readOnlyAriaLabel = EditorView.contentAttributes.of({ 'aria-label': 'Visualização de JSON' })
const editAriaLabel = EditorView.contentAttributes.of({ 'aria-label': 'Editor de JSON' })

/**
 * Organism: the right-panel CodeMirror-based JSON viewer/editor.
 * Displays the current JSON tree as formatted text in read-only mode.
 * Supports toggling into manual edit mode with validation.
 */
export function JsonPanel(): React.JSX.Element {
  const { editingJson, editingText, editError, cmTheme, cmSyntax, jsonStr, handleEditorChange } = useJsonPanel()

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title="JSON Final"
        subheader={editingJson ? 'Modo edição manual — valide ou cancele para continuar' : 'Somente leitura'}
      />
      <CardContent>
        <JsonToolbar />

        {editingJson ? (
          <Box>
            <CodeMirror
              value={editingText}
              theme="none"
              basicSetup={{ drawSelection: false }}
              extensions={[json(), cmTheme, cmSyntax, editAriaLabel]}
              onChange={handleEditorChange}
              style={{
                fontSize: 14,
                textAlign: 'left',
                border: editError ? '2px solid #d32f2f' : '1px solid rgba(0,0,0,0.23)',
                borderRadius: 4,
              }}
            />
            {editError && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                {editError}
              </Typography>
            )}
          </Box>
        ) : (
          <CodeMirror
            value={jsonStr}
            theme="none"
            basicSetup={{ drawSelection: false }}
            extensions={[json(), cmTheme, cmSyntax, readOnlyAriaLabel]}
            editable={false}
            style={{ fontSize: 14, textAlign: 'left', border: '1px solid rgba(0,0,0,0.23)', borderRadius: 4, minHeight: 300 }}
          />
        )}
      </CardContent>
    </Card>
  )
}

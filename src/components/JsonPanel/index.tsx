import { Box, Button, Card, CardContent, CardHeader, IconButton, Tooltip, Typography, useMediaQuery, useTheme } from '@mui/material'
import { Pencil, Copy, X, CheckCheck, Download } from 'lucide-react'
import CodeMirror from '@uiw/react-codemirror'
import { json } from '@codemirror/lang-json'
import { useUiStore } from '../../store/uiStore'
import { useJsonStore } from '../../store/jsonStore'
import { codeMirrorLightTheme, codeMirrorDarkTheme, codeMirrorLightSyntax, codeMirrorDarkSyntax } from '../../theme'

export function JsonPanel() {
  const { mode, editingJson, editingText, editError, startEditing, cancelEditing, setEditingText, setEditError, setToast } = useUiStore()
  const { jsonValue, setJsonValue } = useJsonStore()

  const theme = useTheme()
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'))
  const cmTheme = mode === 'dark' ? codeMirrorDarkTheme : codeMirrorLightTheme
  const cmSyntax = mode === 'dark' ? codeMirrorDarkSyntax : codeMirrorLightSyntax
  const jsonStr = JSON.stringify(jsonValue, null, 2)

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title="JSON Final"
        subheader={editingJson ? 'Modo edição manual — valide ou cancele para continuar' : 'Somente leitura'}
      />
      <CardContent>
        {editingJson ? (
          <Box sx={{ display: 'flex', gap: 1, mb: 1.5, justifyContent: 'center' }}>
            {isSmall ? (
              <>
                <Tooltip title="Cancelar">
                  <IconButton size="small" color="error" onClick={cancelEditing}>
                    <X size={16} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Validar">
                  <IconButton
                    size="small"
                    color="success"
                    onClick={() => {
                      try {
                        const parsed = JSON.parse(editingText)
                        setJsonValue(() => parsed)
                        cancelEditing()
                        setToast({ msg: 'JSON válido aplicado com sucesso.', severity: 'success' })
                      } catch (e) {
                        const msg = e instanceof Error ? e.message : 'JSON inválido.'
                        setEditError(msg)
                        setToast({ msg: `JSON inválido: ${msg}`, severity: 'error' })
                      }
                    }}
                  >
                    <CheckCheck size={16} />
                  </IconButton>
                </Tooltip>
              </>
            ) : (
              <>
                <Button size="small" variant="outlined" color="error" startIcon={<X size={14} />} onClick={cancelEditing}>
                  Cancelar
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="success"
                  startIcon={<CheckCheck size={14} />}
                  onClick={() => {
                    try {
                      const parsed = JSON.parse(editingText)
                      setJsonValue(() => parsed)
                      cancelEditing()
                      setToast({ msg: 'JSON válido aplicado com sucesso.', severity: 'success' })
                    } catch (e) {
                      const msg = e instanceof Error ? e.message : 'JSON inválido.'
                      setEditError(msg)
                      setToast({ msg: `JSON inválido: ${msg}`, severity: 'error' })
                    }
                  }}
                >
                  Validar
                </Button>
              </>
            )}
          </Box>
        ) : (
          <Box sx={{ mb: 1.5, display: 'flex', gap: 1, justifyContent: 'center' }}>
            {isSmall ? (
              <>
                <Tooltip title="Editar JSON">
                  <IconButton size="small" color="primary" onClick={() => startEditing(jsonStr)}>
                    <Pencil size={16} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Copiar">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => {
                      navigator.clipboard.writeText(jsonStr)
                        .then(() => setToast({ msg: 'JSON copiado para o clipboard!', severity: 'success' }))
                        .catch(() => setToast({ msg: 'Falha ao copiar o JSON.', severity: 'error' }))
                    }}
                  >
                    <Copy size={16} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Copiar minificado">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(jsonValue))
                        .then(() => setToast({ msg: 'JSON minificado copiado para o clipboard!', severity: 'success' }))
                        .catch(() => setToast({ msg: 'Falha ao copiar o JSON.', severity: 'error' }))
                    }}
                  >
                    <Copy size={16} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Baixar">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => {
                      const blob = new Blob([jsonStr], { type: 'application/json' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = 'data.json'
                      a.click()
                      URL.revokeObjectURL(url)
                      setToast({ msg: 'JSON baixado com sucesso!', severity: 'success' })
                    }}
                  >
                    <Download size={16} />
                  </IconButton>
                </Tooltip>
              </>
            ) : (
              <>
                <Button size="small" variant="outlined" startIcon={<Pencil size={14} />} onClick={() => startEditing(jsonStr)}>
                  Editar JSON
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Copy size={14} />}
                  onClick={() => {
                    navigator.clipboard.writeText(jsonStr)
                      .then(() => setToast({ msg: 'JSON copiado para o clipboard!', severity: 'success' }))
                      .catch(() => setToast({ msg: 'Falha ao copiar o JSON.', severity: 'error' }))
                  }}
                >
                  Copiar
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Copy size={14} />}
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(jsonValue))
                      .then(() => setToast({ msg: 'JSON minificado copiado para o clipboard!', severity: 'success' }))
                      .catch(() => setToast({ msg: 'Falha ao copiar o JSON.', severity: 'error' }))
                  }}
                >
                  Copiar minificado
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Download size={14} />}
                  onClick={() => {
                    const blob = new Blob([jsonStr], { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = 'data.json'
                    a.click()
                    URL.revokeObjectURL(url)
                    setToast({ msg: 'JSON baixado com sucesso!', severity: 'success' })
                  }}
                >
                  Baixar
                </Button>
              </>
            )}
          </Box>
        )}

        {editingJson ? (
          <Box>
            <CodeMirror
              value={editingText}
              theme="none"
              basicSetup={{ drawSelection: false }}
              extensions={[json(), cmTheme, cmSyntax]}
              onChange={(val) => { setEditingText(val); setEditError(null) }}
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
            extensions={[json(), cmTheme, cmSyntax]}
            editable={false}
            style={{ fontSize: 14, textAlign: 'left', border: '1px solid rgba(0,0,0,0.23)', borderRadius: 4, minHeight: 300 }}
          />
        )}
      </CardContent>
    </Card>
  )
}

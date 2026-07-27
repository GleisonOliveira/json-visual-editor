import type React from 'react'
import { useCallback } from 'react'
import { Alert, Box, Grid, Snackbar } from '@mui/material'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { lightTheme, darkTheme } from './theme'
import { useUiStore } from './store/uiStore'
import { TopBar } from './components/organisms/top-bar/TopBar'
import { VisualEditor } from './components/organisms/visual-editor/VisualEditor'
import { JsonPanel } from './components/organisms/json-panel/JsonPanel'

export default function App(): React.JSX.Element {
  const { mode, toast, setToast } = useUiStore()
  const muiTheme = mode === 'dark' ? darkTheme : lightTheme
  const handleToastClose = useCallback(() => setToast(null), [setToast])

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <Box
        component="a"
        href="#main-content"
        sx={{
          position: 'absolute',
          left: -9999,
          top: 'auto',
          width: 1,
          height: 1,
          overflow: 'hidden',
          zIndex: 9999,
          '&:focus': {
            position: 'fixed',
            left: 8,
            top: 8,
            width: 'auto',
            height: 'auto',
            p: 1,
            bgcolor: 'primary.main',
            color: '#fff',
            borderRadius: 1,
            textDecoration: 'none',
            fontWeight: 700,
          },
        }}
      >
        Pular para o conteúdo
      </Box>
      <Box component="main" id="main-content" sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
        <TopBar />
        <Grid container spacing={2} sx={{ alignItems: 'stretch', p: 2 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <VisualEditor />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <JsonPanel />
          </Grid>
        </Grid>
        <Snackbar
          open={!!toast}
          autoHideDuration={4000}
          onClose={handleToastClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity={toast?.severity ?? 'info'} onClose={handleToastClose} variant="filled">
            {toast?.msg}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  )
}

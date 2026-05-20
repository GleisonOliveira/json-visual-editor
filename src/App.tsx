import { Alert, Box, Grid, Snackbar } from '@mui/material'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { lightTheme, darkTheme } from './theme'
import { useUiStore } from './store/uiStore'
import { TopBar } from './components/TopBar'
import { VisualEditor } from './components/VisualEditor'
import { JsonPanel } from './components/JsonPanel'

export default function App() {
  const { mode, toast, setToast } = useUiStore()
  const muiTheme = mode === 'dark' ? darkTheme : lightTheme

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <Box component="main" sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
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
          onClose={() => setToast(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity={toast?.severity ?? 'info'} onClose={() => setToast(null)} variant="filled">
            {toast?.msg}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  )
}

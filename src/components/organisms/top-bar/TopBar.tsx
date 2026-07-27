import type React from 'react'
import { memo } from 'react'
import { Box, IconButton, Tooltip, Typography } from '@mui/material'
import { Braces, Sun, Moon } from 'lucide-react'
import { useTopBar } from './useTopBar'

/**
 * Organism: application header bar.
 * Renders the app title "JSON Visual Editor" with a Braces icon,
 * a dark/light theme toggle, and a GitHub link.
 */
export const TopBar = memo(function TopBar(): React.JSX.Element {
  const { mode, toggleMode } = useTopBar()

  return (
    <Box
      className="topbar"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 3,
        py: 2,
        background: 'linear-gradient(135deg, #6a00f4 0%, #aa3bff 60%, #c084fc 100%)',
        boxShadow: '0 4px 20px rgba(170,59,255,0.35)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Braces size={28} color="#fff" />
        <Typography
          component="h1"
          variant="h5"
          sx={{ color: '#fff', fontWeight: 700, letterSpacing: '-0.5px', lineHeight: 1, m: 0 }}
        >
          JSON Visual Editor
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Tooltip title={mode === 'dark' ? 'Tema claro' : 'Tema escuro'} arrow>
          <IconButton onClick={toggleMode} sx={{ color: '#fff', '&:hover': { background: 'rgba(255,255,255,0.15)' } }}>
            {mode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </IconButton>
        </Tooltip>
        <Tooltip title="Ver no GitHub" arrow>
          <IconButton
            component="a"
            href="https://github.com/GleisonOliveira/json-visual-editor"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ color: '#fff', '&:hover': { background: 'rgba(255,255,255,0.15)' } }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .322.216.694.825.576C20.565 21.796 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
            </svg>
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  )
})

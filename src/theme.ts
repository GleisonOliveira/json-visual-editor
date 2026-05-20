import { createTheme } from '@mui/material/styles'
import { EditorView } from '@codemirror/view'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#f0f0f0',
      paper: '#f7f7f8',
    },
    text: {
      primary: '#2c2c2e',
      secondary: '#5c5c6e',
    },
    divider: '#dcdce0',
    primary: {
      main: '#aa3bff',
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#f7f7f8',
          border: '1px solid #dcdce0',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#fff',
        },
      },
    },
  },
})

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#1a1b22',
      paper: '#22232e',
    },
    text: {
      primary: '#e2e2e8',
      secondary: '#9a9ab0',
    },
    divider: '#4a4b5e',
    primary: {
      main: '#c084fc',
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#22232e',
          border: '1px solid #2e2f3a',
          boxShadow: '0 1px 8px rgba(0,0,0,0.3)',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#1a1b22',
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          backgroundColor: '#1a1b22',
        },
      },
    },
  },
})

export const codeMirrorLightTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: '#f7f7f8',
      color: '#2c2c2e',
    },
    '& .cm-scroller': {
      backgroundColor: '#f7f7f8',
    },
    '.cm-content': { caretColor: '#aa3bff', backgroundColor: '#f7f7f8' },
    '.cm-cursor': { borderLeftColor: '#aa3bff' },
    '.cm-gutters': {
      backgroundColor: '#ececef',
      color: '#888',
      border: 'none',
    },
    '.cm-activeLineGutter': { backgroundColor: '#e2e2e8' },
    '.cm-activeLine': { backgroundColor: 'rgba(170,59,255,0.06)' },
    '.cm-selectionBackground': {
      backgroundColor: 'rgba(170,59,255,0.25) !important',
    },
    '.cm-matchingBracket': { backgroundColor: 'rgba(170,59,255,0.2)', outline: 'none' },
  },
  { dark: false }
)

export const codeMirrorDarkTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: '#22232e',
      color: '#e2e2e8',
    },
    '& .cm-scroller': {
      backgroundColor: '#22232e',
    },
    '.cm-content': { caretColor: '#c084fc', backgroundColor: '#22232e' },
    '.cm-cursor': { borderLeftColor: '#c084fc' },
    '.cm-gutters': {
      backgroundColor: '#1a1b22',
      color: '#555',
      border: 'none',
    },
    '.cm-activeLineGutter': { backgroundColor: '#1f2030' },
    '.cm-activeLine': { backgroundColor: 'rgba(192,132,252,0.08)' },
    '.cm-selectionBackground': {
      backgroundColor: 'rgba(192,132,252,0.3) !important',
    },
    '.cm-matchingBracket': { backgroundColor: 'rgba(192,132,252,0.25)', outline: 'none' },
  },
  { dark: true }
)

const lightHighlight = HighlightStyle.define([
  { tag: tags.string, color: '#1a6b2e' },
  { tag: tags.number, color: '#9a3c00' },
  { tag: tags.bool, color: '#7c3aed' },
  { tag: tags.null, color: '#6b6375' },
  { tag: tags.propertyName, color: '#0c4a8a' },
  { tag: tags.punctuation, color: '#5c5c6e' },
])

const darkHighlight = HighlightStyle.define([
  { tag: tags.string, color: '#86efac' },
  { tag: tags.number, color: '#fdba74' },
  { tag: tags.bool, color: '#c4b5fd' },
  { tag: tags.null, color: '#94a3b8' },
  { tag: tags.propertyName, color: '#7dd3fc' },
  { tag: tags.punctuation, color: '#9a9ab0' },
])

export const codeMirrorLightSyntax = syntaxHighlighting(lightHighlight)
export const codeMirrorDarkSyntax = syntaxHighlighting(darkHighlight)

import { useUiStore } from '../../../store/uiStore'

/**
 * Composable for the TopBar organism.
 * Provides theme mode and toggle handler.
 */
export function useTopBar(): {
  mode: 'light' | 'dark'
  toggleMode: () => void
} {
  const { mode, toggleMode } = useUiStore()

  return { mode, toggleMode }
}

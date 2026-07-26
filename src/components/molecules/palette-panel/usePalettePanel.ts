import { useUiStore } from '../../../store/uiStore'

/**
 * Composable for PalettePanel.
 * Returns the locked state based on whether JSON is being manually edited.
 */
export function usePalettePanel(): { isLocked: boolean } {
  const { editingJson } = useUiStore()

  return { isLocked: editingJson }
}

import { useUiStore } from '../../../store/uiStore'

/**
 * Composable for the VisualEditor organism.
 * Provides the editing state to control whether the palette and tree are locked.
 */
export function useVisualEditor(): { editingJson: boolean } {
  const { editingJson } = useUiStore()

  return { editingJson }
}

import type { JsonValue } from '../types'
import { useJsonStore } from '../store/jsonStore'

/**
 * After a palette insert into a parent container, finds the newly inserted child
 * and expands it in the UI. Reads the latest JSON state from the store, walks to
 * the parentPath, determines the new child's key (last index for arrays, last key
 * for objects), and calls expandPathFn to auto-expand it.
 *
 * @param parentPath - Path to the parent container that received the insert
 * @param expandPathFn - Function to expand a path in the UI (e.g., useUiStore.expandPath)
 */
export function expandInserted(
  parentPath: Array<string | number>,
  expandPathFn: (p: Array<string | number>) => void,
): void {
  const newJson = useJsonStore.getState().jsonValue
  let node: JsonValue = newJson
  for (const seg of parentPath) node = (node as Record<string | number, JsonValue>)[seg] as JsonValue
  let newKey: string | number
  if (Array.isArray(node)) newKey = node.length - 1
  else newKey = Object.keys(node as object).at(-1)!
  expandPathFn([...parentPath, newKey])
}

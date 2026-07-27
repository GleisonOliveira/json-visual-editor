/**
 * Compares two path arrays by segment equality without JSON.stringify serialization.
 * Paths are arrays of string | number segments representing a location in a JSON tree.
 *
 * @param a - First path array
 * @param b - Second path array
 * @returns true if both paths have the same length and identical segments at each index
 */
export function pathsEqual(a: readonly (string | number)[], b: readonly (string | number)[]): boolean {
  if (a.length !== b.length) return false

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }

  return true
}

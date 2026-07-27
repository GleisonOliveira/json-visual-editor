/**
 * Compares two Sets by checking size and element membership.
 * Returns true if both sets contain the same elements.
 */
export function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a === b) return true
  if (a.size !== b.size) return false

  for (const v of a) {
    if (!b.has(v)) return false
  }

  return true
}

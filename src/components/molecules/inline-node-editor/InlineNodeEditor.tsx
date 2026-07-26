import type React from 'react'
import { TypeSelector } from '../../atoms/type-selector/TypeSelector'
import { ValueInput } from '../../atoms/value-input/ValueInput'
import { useInlineNodeEditor } from './useInlineNodeEditor'
import type { JsonValue } from '../../../types'

/**
 * Molecule: renders the type selector and value input for a single non-root JSON node.
 * For leaf types (string/number/boolean/null) renders both TypeSelector and ValueInput.
 * For complex types (object/array) renders only TypeSelector.
 * Used inside ObjectItem and ArrayItem.
 */
export function InlineNodeEditor(props: {
  value: JsonValue
  path: Array<string | number>
  locked: boolean
}): React.JSX.Element {
  const { value, path, locked } = props
  const { nodeType } = useInlineNodeEditor(value)

  return (
    <>
      <TypeSelector path={path} nodeType={nodeType} locked={locked} />
      <ValueInput value={value} path={path} nodeType={nodeType} locked={locked} />
    </>
  )
}

import type React from 'react'
import { memo } from 'react'
import { TypeSelector } from '../../atoms/type-selector/TypeSelector'
import { ValueInput } from '../../atoms/value-input/ValueInput'
import { useInlineNodeEditor } from './useInlineNodeEditor'
import type { JsonValue } from '../../../types'
import { pathsEqual } from '../../../lib/pathsEqual'

interface InlineNodeEditorProps {
  value: JsonValue
  path: Array<string | number>
  locked: boolean
}

function compareInlineNodeEditorProps(prev: InlineNodeEditorProps, next: InlineNodeEditorProps): boolean {
  return (
    prev.value === next.value
    && prev.locked === next.locked
    && pathsEqual(prev.path, next.path)
  )
}

/**
 * Molecule: renders the type selector and value input for a single non-root JSON node.
 * For leaf types (string/number/boolean/null) renders both TypeSelector and ValueInput.
 * For complex types (object/array) renders only TypeSelector.
 * Used inside ObjectItem and ArrayItem.
 */
export const InlineNodeEditor = memo(function InlineNodeEditor(props: InlineNodeEditorProps): React.JSX.Element {
  const { value, path, locked } = props
  const { nodeType } = useInlineNodeEditor(value)

  return (
    <>
      <TypeSelector path={path} nodeType={nodeType} locked={locked} />
      <ValueInput value={value} path={path} nodeType={nodeType} locked={locked} />
    </>
  )
}, compareInlineNodeEditorProps)

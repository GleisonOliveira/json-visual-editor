export type JsonPrimitive = string | number | boolean | null

// Interfaces allow circular references that type aliases cannot express
export interface JsonObject {
  [key: string]: JsonValue
}

export type JsonArray = Array<JsonValue>

export type JsonValue = JsonPrimitive | JsonObject | JsonArray

export type NodeKind = 'object' | 'array' | 'value'

export type NodeTarget = {
  label: string
  path: Array<string | number>
  kind: NodeKind
}

export type PalettePayload = { fromPalette: true; paletteType: string }

export type DndPayload =
  | { fromPath: Array<string | number>; fromKey?: string }
  | PalettePayload

export type FieldType = 'string' | 'number' | 'boolean' | 'object' | 'array'

export type NullableFieldType = FieldType | 'null'

export type InsertValueOpts = {
  valueText: string
  valueNumber: number
  valueBoolean: boolean
  isNull: boolean
}

export type BuildDefaultValueOpts = InsertValueOpts & {
  type: string
  name: string
}

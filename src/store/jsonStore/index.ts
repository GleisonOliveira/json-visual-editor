import { create } from 'zustand'
import type { JsonStore } from './types'
import { updatePrimitive, moveNode, insertFromPalette, applyInsert } from '../../lib/jsonUtils'

export const useJsonStore = create<JsonStore>((set) => ({
  jsonValue: {},
  setJsonValue: (updater) => set((s) => ({ jsonValue: updater(s.jsonValue) })),
  handleUpdate: (path, next) =>
    set((s) => ({ jsonValue: updatePrimitive(s.jsonValue, path, next) })),
  handleMove: (payload, toParentPath, toKey) =>
    set((s) => ({ jsonValue: moveNode(s.jsonValue, payload, toParentPath, toKey) })),
  handleInsert: (paletteType, toParentPath, toKey) =>
    set((s) => ({ jsonValue: insertFromPalette(s.jsonValue, paletteType, toParentPath, toKey) })),
  handleApplyInsert: (target, name, type, insertValue) =>
    set((s) => ({ jsonValue: applyInsert(s.jsonValue, target, name, type, insertValue) })),
}))

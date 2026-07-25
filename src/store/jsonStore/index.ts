import { create } from 'zustand'
import type { JsonStore } from './types'
import { createJsonActions } from './actions'
import { container } from '../../core/container'

const jsonActions = createJsonActions(container)

export const useJsonStore = create<JsonStore>((set) => ({
  jsonValue: {},
  setJsonValue: (updater) => set((s) => ({ jsonValue: jsonActions.setJsonValue(s.jsonValue, updater) })),
  handleUpdate: (path, next) =>
    set((s) => ({ jsonValue: jsonActions.handleUpdate(s.jsonValue, path, next) })),
  handleMove: (payload, toParentPath, toKey) =>
    set((s) => ({ jsonValue: jsonActions.handleMove(s.jsonValue, payload, toParentPath, toKey) })),
  handleInsert: (paletteType, toParentPath, toKey) =>
    set((s) => ({ jsonValue: jsonActions.handleInsert(s.jsonValue, paletteType, toParentPath, toKey) })),
  handleApplyInsert: (target, name, type, insertValue) =>
    set((s) => ({ jsonValue: jsonActions.handleApplyInsert(s.jsonValue, target, name, type, insertValue) })),
}))

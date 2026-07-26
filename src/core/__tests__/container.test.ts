import { describe, it, expect } from 'vitest'
import { container } from '../container'
import { TYPES } from '../types'
import { JsonTreeService } from '../../services/JsonTreeService'
import { JsonMutationService } from '../../services/JsonMutationService'
import { JsonValidationService } from '../../services/JsonValidationService'
import { ClipboardService } from '../../services/ClipboardService'
import { FileDownloadService } from '../../services/FileDownloadService'

describe('DI Container', () => {
  it('resolves JsonTreeService', () => {
    const svc = container.get<JsonTreeService>(TYPES.JsonTreeService)
    expect(svc).toBeInstanceOf(JsonTreeService)
  })

  it('resolves JsonMutationService', () => {
    const svc = container.get<JsonMutationService>(TYPES.JsonMutationService)
    expect(svc).toBeInstanceOf(JsonMutationService)
  })

  it('resolves JsonValidationService', () => {
    const svc = container.get<JsonValidationService>(TYPES.JsonValidationService)
    expect(svc).toBeInstanceOf(JsonValidationService)
  })

  it('resolves ClipboardService', () => {
    const svc = container.get<ClipboardService>(TYPES.ClipboardService)
    expect(svc).toBeInstanceOf(ClipboardService)
  })

  it('resolves FileDownloadService', () => {
    const svc = container.get<FileDownloadService>(TYPES.FileDownloadService)
    expect(svc).toBeInstanceOf(FileDownloadService)
  })

  it('JsonMutationService receives JsonTreeService via DI', () => {
    const mutation = container.get<JsonMutationService>(TYPES.JsonMutationService)
    expect(mutation.tree).toBeInstanceOf(JsonTreeService)
  })
})

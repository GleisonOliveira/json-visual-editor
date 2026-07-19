/** DI token symbols for service bindings. */
export const TYPES = {
  JsonTreeService: Symbol.for('JsonTreeService'),
  JsonMutationService: Symbol.for('JsonMutationService'),
  JsonValidationService: Symbol.for('JsonValidationService'),
  ClipboardService: Symbol.for('ClipboardService'),
  FileDownloadService: Symbol.for('FileDownloadService'),
} as const

import { Container } from 'inversify'
import { TYPES } from './types'
import { JsonTreeService } from '../services/JsonTreeService'
import { JsonMutationService } from '../services/JsonMutationService'
import { JsonValidationService } from '../services/JsonValidationService'
import { ClipboardService } from '../services/ClipboardService'
import { FileDownloadService } from '../services/FileDownloadService'

/**
 * Application-wide inversify container.
 * Uses explicit `to` bindings (no decorators) because the project enables
 * `erasableSyntaxOnly` which forbids TypeScript decorator syntax.
 */
const container = new Container()

container.bind<JsonTreeService>(TYPES.JsonTreeService).to(JsonTreeService).inSingletonScope()
container.bind<JsonMutationService>(TYPES.JsonMutationService).toDynamicValue(
  () => new JsonMutationService(new JsonTreeService())
).inSingletonScope()
container.bind<JsonValidationService>(TYPES.JsonValidationService).to(JsonValidationService).inSingletonScope()
container.bind<ClipboardService>(TYPES.ClipboardService).to(ClipboardService).inSingletonScope()
container.bind<FileDownloadService>(TYPES.FileDownloadService).to(FileDownloadService).inSingletonScope()

export { container }

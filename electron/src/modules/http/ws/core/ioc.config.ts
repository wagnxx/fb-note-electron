import { getContainerModule, provide } from '../di'

export { injectable, inject, Container } from 'inversify'
export { TYPES } from './types'
// export { provide, buildProviderModule } from './decorators/inversify-bind'
export { action, getActionMetadata } from './decorators/ws'

export const buildProviderModule = getContainerModule
export { provide }

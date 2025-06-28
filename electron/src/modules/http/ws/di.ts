import { createProvideFactory, buildProviderModuleFor } from '@/core/di'

const containerId = 'http.ws'

export const provide = createProvideFactory(containerId)

export function getContainerModule() {
  return buildProviderModuleFor(containerId)
}

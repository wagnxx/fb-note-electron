import { createProvideFactory, buildProviderModuleFor } from '@/core/di'

const containerId = 'http.express'

export const provide = createProvideFactory(containerId)

export function getContainerModule() {
  return buildProviderModuleFor(containerId)
}

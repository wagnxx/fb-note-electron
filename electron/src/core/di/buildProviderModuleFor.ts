import { ContainerModule } from 'inversify'
import { getProvidersFor } from './createProvideFactory'

/**
 * 构建某个 containerId 对应的 Inversify 模块
 */
export function buildProviderModuleFor(containerId: string): ContainerModule {
  const providers = getProvidersFor(containerId)

  return new ContainerModule(({ bind }) => {
    for (const { id, target } of providers) {
      bind(id).to(target).inSingletonScope()
    }
  })
}

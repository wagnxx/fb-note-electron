import 'reflect-metadata'
import { injectable } from 'inversify'
import type { ServiceIdentifier, Newable } from 'inversify'

type Provider = { id: ServiceIdentifier<any>; target: Newable<any> }

// 全局容器 => 每个 containerId 拥有独立的注册表
const providerRegistry = new Map<string, Provider[]>()

/**
 * 创建一个模块作用域的 provide 装饰器工厂
 */
export function createProvideFactory(containerId: string) {
  if (!providerRegistry.has(containerId)) {
    providerRegistry.set(containerId, [])
  }

  const providers = providerRegistry.get(containerId)!

  function provide<T extends Newable<any>>(target: T): void
  function provide<T>(id: ServiceIdentifier<T>): (target: Newable<T>) => void

  function provide<T>(idOrTarget: ServiceIdentifier<T> | Newable<T>): void | ((target: Newable<T>) => void) {
    if (typeof idOrTarget === 'function') {
      const target = idOrTarget as Newable<any>
      injectable()(target)
      providers.push({ id: target, target })
    } else {
      const id = idOrTarget
      return function (target: Newable<T>) {
        injectable()(target)
        providers.push({ id, target })
      }
    }
  }

  return provide
}

/**
 * 供外部访问某个 containerId 下的 provider 列表
 */
export function getProvidersFor(containerId: string): Provider[] {
  return providerRegistry.get(containerId) || []
}

/**
 * 清空所有 container 的 provider（测试/热重载可用）
 */
export function resetAllProviders() {
  providerRegistry.clear()
}

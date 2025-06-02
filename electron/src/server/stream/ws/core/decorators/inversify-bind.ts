// src/di/inversify-provide.ts
import 'reflect-metadata'
import { ContainerModule, injectable } from 'inversify'
import type { ServiceIdentifier, Newable } from 'inversify'

// 注册表存储所有被 @provide 装饰的类和标识
const registeredProviders: Array<{ id: ServiceIdentifier<any>; target: Newable<any> }> = []

// 装饰器重载签名
export function provide<T extends Newable<any>>(target: T): void
export function provide<T>(id: ServiceIdentifier<T>): (target: Newable<T>) => void

/**
 * 提供服务注入功能装饰器（可选 ID）
 */
export function provide<T>(idOrTarget: ServiceIdentifier<T> | Newable<T>): void | ((target: Newable<T>) => void) {
  if (typeof idOrTarget === 'function') {
    const target = idOrTarget as Newable<T> // 👈 显式断言
    injectable()(target)
    registeredProviders.push({ id: target, target })
  } else {
    const id = idOrTarget
    return function (target: Newable<T>) {
      injectable()(target)
      registeredProviders.push({ id, target }) // ✔ 无需断言
    }
  }
}

/**
 * 批量注册所有装饰过的 Provider，返回 ContainerModule
 */
export function buildProviderModule(): ContainerModule {
  return new ContainerModule(({ bind }) => {
    for (const { id, target } of registeredProviders) {
      bind(id).to(target).inSingletonScope() // 默认单例模式
    }
  })
}

/**
 * 重置 Provider 注册表（测试或热重载时可用）
 */
export function resetProviders(): void {
  registeredProviders.length = 0
}

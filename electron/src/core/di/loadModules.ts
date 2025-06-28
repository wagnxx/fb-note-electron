import type { IModule } from '@/core/di/IModule'
import { HttpModule } from '@/modules/http'
// import { IpcModule } from '@/modules/ipc'

const moduleMap = new Map<string, IModule>()

function register(mod: IModule, name: string) {
  moduleMap.set(name, mod)
}

register(new HttpModule(), 'http')
// register(new IpcModule(), 'ipc')
// ... add more

export async function startModules() {
  for (const mod of moduleMap.values()) {
    await mod.start?.()
  }
}

export async function stopModules() {
  for (const mod of [...moduleMap.values()].reverse()) {
    await mod.stop?.()
  }
}

export async function restartModule(name: string) {
  const mod = moduleMap.get(name)
  if (!mod) return
  await mod.stop?.()
  await mod.start?.()
}

export async function restartModules() {
  for (const mod of [...moduleMap.values()].reverse()) {
    await mod.stop?.()
  }
  for (const mod of moduleMap.values()) {
    await mod.start?.()
  }
}

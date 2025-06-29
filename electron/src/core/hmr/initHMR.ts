import path from 'path'
import HotModuleReloader from './HotModuleReloader'
import { restartModule } from '@/core/di/loadModules'
import * as config from '@/config'

// HMR 逻辑和服务重启
export function runHMR() {
  const reloader = new HotModuleReloader(path.join(config.getDistPath(), 'electron/src'), {
    // include: ['server'],
    exclude: ['main.js'],
    onReload: async (_mod: any, filePath: string) => {
      // console.log('update ::::: ', _mod, filePath);
      // 只重启 http 模块
      if (filePath.includes('modules/http')) {
        try {
          await restartModule('http')
          console.log('[HMR] HTTP module restarted.')
        } catch (err) {
          console.error('[HMR] Failed to restart http module:', err)
        }
      }
    },
  })

  reloader.init()
}

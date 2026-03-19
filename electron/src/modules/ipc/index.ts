import type { ChildProcess } from 'child_process'
import { setupFileHandler } from './handlers/file'
import { imageHandler } from './handlers/image'
import { setupSocksHandler } from './handlers/socks'
import { setupVideoStreamHandler } from './handlers/video'
import { setupWritingHandler } from './handlers/writing'
import { BaseModule } from '@/core/di'

export class IpcModule extends BaseModule {
  static moduleName = 'ipc'
  private childProcesses: (ChildProcess | null)[] = []

  async start() {
    const { socksProcess } = setupSocksHandler()
    this.childProcesses.push(socksProcess)

    setupVideoStreamHandler()
    setupFileHandler()
    imageHandler()
    setupWritingHandler()
  }

  async stop() {
    for (const proc of this.childProcesses) {
      try {
        proc?.kill()
      } catch (e) {
        console.warn('[IpcModule] Failed to kill child process:', e)
      }
    }
  }
}

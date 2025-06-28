import type { IModule } from './IModule'

export abstract class BaseModule implements IModule {
  abstract start(): Promise<void>
  abstract stop(): Promise<void>

  async restart(): Promise<void> {
    await this.stop()
    await this.start()
  }
}

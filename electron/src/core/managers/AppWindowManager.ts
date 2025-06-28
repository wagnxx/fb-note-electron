// AppWindowManager.ts
import { app, BrowserWindow } from 'electron'

class AppWindowManager {
  private static instance: AppWindowManager | null = null
  private appInstance: typeof app | null = null
  private winInstance: BrowserWindow | null = null

  private constructor() {}

  public static getInstance(): AppWindowManager {
    if (!this.instance) {
      this.instance = new AppWindowManager()
    }
    return this.instance
  }

  public setAppInstance(appInstance: typeof app): void {
    this.appInstance = appInstance
  }

  public setWinInstance(winInstance: BrowserWindow): void {
    this.winInstance = winInstance
  }

  public getAppInstance(): typeof app | null {
    return this.appInstance
  }

  public getWinInstance(): BrowserWindow | null {
    return this.winInstance
  }
}

export default AppWindowManager

// utils.ts 或 actionUtils.ts

class Action {
  private static instance: Action | null = null

  private constructor() {}

  public static getInstance(): Action {
    if (!Action.instance) {
      Action.instance = new Action()
    }
    return Action.instance
  }

  private _sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  public do(fn: (...args: any[]) => void) {
    fn?.()
    console.log('Do something')
    return this
  }

  public sleep(ms: number) {
    return this._sleep(ms).then(() => this)
  }

  public then(callback: () => void) {
    callback()
    return this
  }
}

export { Action }

import { IMessageDispatcher } from '../interfaces/types'

export abstract class BaseWsController {
  protected dispatcher: IMessageDispatcher

  constructor(dispatcher: IMessageDispatcher) {
    this.dispatcher = dispatcher
    this.registerHandlers(dispatcher)
  }

  protected abstract registerHandlers(dispatcher: IMessageDispatcher): void

  public getDispatcher(): IMessageDispatcher {
    return this.dispatcher
  }
}

import { getActionMetadata } from '../core/ioc.config'
import { MessageDispatcher } from '../core/MessageDispatcher'
import { IMessageDispatcher, ReciveMessageType } from '../interfaces/types'

export abstract class BaseWsController {
  protected dispatcher: IMessageDispatcher

  constructor() {
    this.dispatcher = new MessageDispatcher()

    const actions = getActionMetadata(this)
    for (const { event, methodName } of actions) {
      const handler = (this as any)[methodName].bind(this)
      this.dispatcher.on(event as ReciveMessageType['type'], handler)
    }
  }

  // protected abstract registerHandlers(dispatcher: IMessageDispatcher): void

  public getDispatcher(): IMessageDispatcher {
    return this.dispatcher
  }
}

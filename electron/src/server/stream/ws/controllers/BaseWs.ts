import { WebSocket } from 'ws'
// import { MessageDispatcher } from './core/messageDispatcher'

import { SafeMessageDispatcher } from '../core/messageDispatcher'
import { MessageDispatcher } from '../types'
// import { MessageDispatcher } from '../types'

export abstract class BaseWsController {
  protected dispatcher: MessageDispatcher

  constructor() {
    this.dispatcher = new SafeMessageDispatcher()
    this.registerHandlers(this.dispatcher)
  }

  protected abstract registerHandlers(dispatcher: MessageDispatcher): void

  public getDispatcher(): MessageDispatcher {
    return this.dispatcher
  }
}

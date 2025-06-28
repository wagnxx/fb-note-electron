// server/stream/core/WebSocketNotifier.ts
import { WebSocketManager } from './WebSocketManager'
import { INotifier } from '../interfaces/INotifier'
import { inject, provide, TYPES } from './ioc.config'
import { ServerToClientMessage } from '../interfaces/types'

@provide(TYPES.WebSocketNotifier)
export class WebSocketNotifier implements INotifier {
  constructor(@inject(TYPES.WebSocketManager) private readonly wsManager: WebSocketManager) {}

  async notifyGroup(groupId: string, message: ServerToClientMessage): Promise<void> {
    // const payload = JSON.stringify(message)
    this.wsManager.broadcastToGroup(groupId, message) // 委托给基础WS管理器
  }
}

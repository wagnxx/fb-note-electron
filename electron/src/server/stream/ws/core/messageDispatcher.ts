import { WebSocket } from 'ws'
import { ReciveMessageType, MessageDispatcher } from '../types'

export class SafeMessageDispatcher implements MessageDispatcher {
  private handlers = new Map<ReciveMessageType['type'], (ws: WebSocket, data: any) => void>()

  on<T extends ReciveMessageType['type']>(
    type: T,
    handler: (ws: WebSocket, data: Extract<ReciveMessageType, { type: T }>) => void,
  ) {
    this.handlers.set(type, handler as any)
  }

  dispatch(ws: WebSocket, data: ReciveMessageType) {
    const handler = this.handlers.get(data.type)
    if (handler) {
      handler(ws, data) // 这里已经确保类型匹配
    } else {
      ws.send(
        JSON.stringify({
          type: 'error',
          message: `Unhandled message type: ${data.type}`,
        }),
      )
    }
  }
}

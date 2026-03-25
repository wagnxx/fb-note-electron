import { WebSocket } from 'ws'
import { ReciveMessageType, IMessageDispatcher } from '../interfaces/types'

export class MessageDispatcher implements IMessageDispatcher {
  private handlers = new Map<ReciveMessageType['type'], (ws: WebSocket, data: any) => void | Promise<void>>()

  on<T extends ReciveMessageType['type']>(
    type: T,
    handler: (ws: WebSocket, data: Extract<ReciveMessageType, { type: T }>) => void | Promise<void>,
  ) {
    this.handlers.set(type, handler as any)
  }

  private sendError(ws: WebSocket, payload: { requestId?: string; sourceType?: string; reason: string }) {
    if (ws.readyState !== WebSocket.OPEN) return
    ws.send(
      JSON.stringify({
        type: 'error',
        payload,
      }),
    )
  }

  dispatch(ws: WebSocket, data: ReciveMessageType) {
    if (!data || typeof data !== 'object' || !('type' in data)) {
      this.sendError(ws, {
        reason: 'Invalid message shape: missing type',
      })
      return
    }

    const handler = this.handlers.get(data.type)
    if (handler) {
      Promise.resolve(handler(ws, data)).catch((err: unknown) => {
        const reason = err instanceof Error ? err.message : 'Handler execution failed'
        this.sendError(ws, {
          requestId: (data as any)?.requestId,
          sourceType: String((data as any)?.type ?? ''),
          reason,
        })
      })
    } else {
      this.sendError(ws, {
        requestId: (data as any)?.requestId,
        sourceType: String((data as any)?.type ?? ''),
        reason: `Unhandled message type: ${data.type}`,
      })
    }
  }
}

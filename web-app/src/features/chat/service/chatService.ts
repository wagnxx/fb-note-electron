import { ClientToServerMessage } from '@shared/types'
import { getWSClientInstance } from './wsClient'
type AnyClientMessage = ClientToServerMessage<any>

export function sendMessage<T extends AnyClientMessage['type']>(
  message: Extract<AnyClientMessage, { type: T }>,
): Promise<any>

export function sendMessage<T extends AnyClientMessage['type']>(
  type: T,
  payload: Extract<AnyClientMessage, { type: T }>['payload'],
): Promise<any>

export function sendMessage(a: string | AnyClientMessage, b?: any): Promise<any> {
  const ws = getWSClientInstance()
  if (!ws) {
    return Promise.reject(new Error('WebSocket client not available'))
  }

  return ws.then(client => {
    if (typeof a === 'string') {
      return client?.request(a, b!)
    } else {
      if (typeof a.type === 'string' && 'payload' in a) {
        return client?.request(a.type, a.payload)
      }
      return Promise.reject(new Error('Invalid message format'))
    }
  })
}

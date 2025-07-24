// features/chat/services/chatService.ts
import { ChatMessage, ClientToServerMessage } from '@shared/types'
import { getWSClientInstance } from './wsClient'

export function sendMessage(msg: ChatMessage | ClientToServerMessage) {
  // const ws = store.getState().chat.wsState.ws
  const ws = getWSClientInstance()
  if (!ws) {
    return
  }
  ws.then(client => {
    client?.send(msg.type, msg)
  })
}

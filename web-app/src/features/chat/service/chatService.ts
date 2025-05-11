// features/chat/services/chatService.ts
import { store } from '@/store/store'
import { ClientMessage, Message } from '../types'

export function sendMessage(msg: Message | ClientMessage) {
  const ws = store.getState().chat.wsState.ws
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg))
  } else {
    console.warn('WebSocket is not connected')
  }
}

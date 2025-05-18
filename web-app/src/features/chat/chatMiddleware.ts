import { Middleware } from '@reduxjs/toolkit'
import { selectGroup } from './chatSlice'

export const chatMiddleware: Middleware = store => next => action => {
  const result = next(action)

  if (selectGroup.match(action)) {
    const state = store.getState()
    const ws = state.chat.wsState.ws
    const groupId = action.payload

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: 'message-history-req',
          groupId,
        }),
      )
    } else {
      console.warn('WebSocket not connected')
    }
  }

  return result
}

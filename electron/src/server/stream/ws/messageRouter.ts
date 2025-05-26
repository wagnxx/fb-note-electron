import { WebSocket } from 'ws'
import {
  handleGetGroupMessages,
  handleGetUser,
  handleGroupCreate,
  handleGroupInit,
  handleGroupRequest,
  handleJoinGroup,
  handleMessage,
  handleResetUser,
} from './handler/group'
import { userService } from './manages/context'
import { ChatMessage, ClientToServerMessage } from './types'

export function routeMessage(ws: WebSocket, data: ChatMessage | ClientToServerMessage, client: any) {
  switch (data.type) {
    case 'join':
      handleJoinGroup(ws, data)
      break
    case 'group-init':
      handleGroupInit(data)
      break
    case 'group-create':
      handleGroupCreate(ws, data)
      break
    case 'group-req':
      handleGroupRequest(ws)
      break
    case 'message-history-req':
      handleGetGroupMessages(ws, data)
      break
    case 'reset-user':
      handleResetUser(ws, data)
      break
    case 'user-req':
      handleGetUser(ws, data)
      break
    case 'text':
    case 'image':
    case 'file':
      handleMessage(data)
      break
    default:
      console.warn('Unknown message type, data is:', data)
  }
}

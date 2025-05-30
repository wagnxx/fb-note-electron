import { WebSocket } from 'ws'

export type {
  ChatGroup as Group,
  ChatClientMetaBase as ClientMeta,
  ServerToClientMessage,
  ChatMessage,
  ChatTextMessage,
  ChatFileMessage,
  ChatImageMessage,
  ClientToServerMessage,
  ChatGroupJoind as JoinedGroupResponse,
} from '@shared/types'

import { ChatMessage, ClientToServerMessage, User as SharedUser, ChatGroupWithMember } from '@shared/types'
import { PartialWithRequiredId } from '@/utils/types'

// ===================== 扩展服务端专用类型 =====================
export type User = SharedUser & {
  socket: WebSocket | null // 服务端需要管理 WebSocket 连接
}

export type ReciveMessageType = ChatMessage | ClientToServerMessage

// 增强的 Group 类型（服务端可能需要更多字段）
export type ServerChatGroup = ChatGroupWithMember & {
  createdAt: number
  lastActive?: number
}

// WebSocket 事件分发器的类型定义
export interface IMessageDispatcher {
  on<T extends ReciveMessageType['type']>(
    type: T,
    handler: (
      ws: WebSocket,
      data: Extract<ReciveMessageType, { type: T }>, // 精确匹配消息类型
    ) => void,
  ): void
  dispatch(ws: WebSocket, data: ReciveMessageType): void
}

export type UpdateUserProps = Omit<User, 'online'> & PartialWithRequiredId<User, 'id' | 'socket'>

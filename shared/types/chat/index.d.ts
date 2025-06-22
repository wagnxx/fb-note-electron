export interface ChatBaseMessage {
  id: string
  sender: string
  groupId: string
  timestamp: number
}

export interface ChatTextMessage extends ChatBaseMessage {
  type: 'text'
  content: string
}

export interface ChatImageMessage extends ChatBaseMessage {
  type: 'image'
  content: string // base64 或 URL
}

export interface ChatFileMessage extends ChatBaseMessage {
  type: 'file'
  fileName: string
  fileType: string
  content: string
}

export type ChatMessage = ChatTextMessage | ChatImageMessage | ChatFileMessage

export interface ChatGroup {
  id: string
  name: string
  // members: Uid[]
  admin: string
  // messages: ChatMessage[]
}
export type ChatGroupWithMember = ChatGroup & {
  members: User[]
}
export type ChatGroupJoind = {
  group: ChatGroupWithMember
  latestMessage: ChatMessage | null
}
export interface ChatClientMetaBase {
  username: string
  groupId: string
  userId: string
  socket?: any // 由环境决定类型
  joined?: boolean
}

// 客户端专用扩展（例如 UI 显示用状态）
export interface ChatClientMetaClient extends ChatClientMetaBase {
  joined: boolean
}
// 服务端专用扩展（包含 WebSocket）
export interface ChatClientMetaServer extends ChatClientMetaBase {
  socket: WebSocket | null
}

// ===================== 客户端 → 服务端 =====================

export type ClientToServerMessage =
  | {
      type: 'join'
      username: string
      groupId: string
      userId: string
    }
  | {
      type: 'group-init'
      groups: ChatGroup[]
    }
  | {
      type: 'group-create'
      group: ChatGroup
    }
  | {
      type: 'groups-req'
    }
  | {
      type: 'message-history-req'
      groupId: string
    }
  | ({
      type: 'reset-user'
    } & User)
  | {
      type: 'users-req'
    }
  | ({
      type: 'init-req'
    } & User)
  | ({
      type: 'joined-groups-req'
    } & Pick<User, 'id'>)

// ===================== 服务端 → 客户端 =====================

export type ServerToClientMessage =
  | ChatMessage
  | {
      type: 'system'
      message: string
    }
  | {
      type: 'groups-res'
      groups: ChatGroupWithMember[]
      timestamp: number
    }
  | {
      type: 'message-history-res'
      groupId: string
      messages: ChatMessage[]
    }
  | ({
      type: 'reset-user-success'
    } & User)
  | {
      type: 'users-res'
      users: User[]
    }
  | {
      type: 'init-res'
      joinedGroups: ChatGroupJoind[]
      allGroups: ChatGroupWithMember[]
      allUsers: User[]
      currentUser: User
    }
  | {
      type: 'joined-groups-res'
      joinedGroups: ChatGroupJoind[]
    }

export type Uid = string
export interface User {
  id: Uid
  name?: string | null
  online?: boolean | null
  avatar?: string | null
}

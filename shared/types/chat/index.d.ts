// ===================== 用户与基础类型 =====================

export type Uid = string

export interface User {
  id: Uid
  name?: string | null
  online?: boolean | null
  avatar?: string | null
}

// ===================== 聊天消息结构 =====================

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

// ===================== 群组结构 =====================

export interface ChatGroup {
  id: string
  name: string
  admin: string
}

export type ChatGroupWithMember = ChatGroup & {
  members: User[]
}

export type ChatGroupJoind = {
  group: ChatGroupWithMember
  latestMessage: ChatMessage | null
}

// ===================== 客户端与服务端会话元数据 =====================

export interface ChatClientMetaBase {
  username: string
  groupId: string
  userId: string
  socket?: any // 类型由运行环境决定
  joined?: boolean
}

export interface ChatClientMetaClient extends ChatClientMetaBase {
  joined: boolean
}

export interface ChatClientMetaServer extends ChatClientMetaBase {
  socket: WebSocket | null
}

// ===================== 客户端 → 服务端 消息 =====================

// 原始消息类型（不含 requestId）
export type RawClientToServerMessage =
  | { type: 'join'; username: string; groupId: string; userId: string }
  | { type: 'group-init'; groups: ChatGroup[] }
  | { type: 'group-create'; group: ChatGroup }
  | { type: 'groups-req' }
  | { type: 'message-history-req'; groupId: string }
  | ({ type: 'reset-user' } & User)
  | { type: 'users-req' }
  | ({ type: 'init-req' } & User)
  | ({ type: 'joined-groups-req' } & Pick<User, 'id'>)

export interface ClientMessagePayloadMap {
  text: ChatTextMessage
  image: ChatImageMessage
  file: ChatFileMessage

  join: { username: string; groupId: string; userId: string }
  'group-init': { groups: ChatGroup[] }
  'group-create': { group: ChatGroup }
  'groups-req': {}
  'message-history-req': { groupId: string }
  'reset-user': User
  'users-req': {}
  'init-req': User
  'joined-groups-req': Pick<User, 'id'>
}

// 最终封装：可选 requestId，用于请求响应匹配
export interface ClientToServerMessage<T extends keyof ClientMessagePayloadMap = keyof ClientMessagePayloadMap> {
  type: T
  payload: ClientMessagePayloadMap[T]
  requestId?: string
}

// ===================== 服务端 → 客户端 消息 =====================

export type RawServerToClientMessage =
  | ChatMessage // 聊天内容推送
  | { type: 'system'; message: string }
  | { type: 'groups-res'; groups: ChatGroupWithMember[]; timestamp: number }
  | { type: 'message-history-res'; groupId: string; messages: ChatMessage[] }
  | ({ type: 'reset-user-success' } & User)
  | { type: 'users-res'; users: User[] }
  | {
      type: 'init-res'
      joinedGroups: ChatGroupJoind[]
      allGroups: ChatGroupWithMember[]
      allUsers: User[]
      currentUser: User
    }
  | { type: 'joined-groups-res'; joinedGroups: ChatGroupJoind[] }

export interface ServerMessagePayloadMap {
  text: ChatTextMessage
  image: ChatImageMessage
  file: ChatFileMessage
  system: { message: string }
  'groups-res': { groups: ChatGroupWithMember[]; timestamp: number }
  'message-history-res': { groupId: string; messages: ChatMessage[] }
  'reset-user-success': User
  'users-res': { users: User[] }
  'init-res': {
    joinedGroups: ChatGroupJoind[]
    allGroups: ChatGroupWithMember[]
    allUsers: User[]
    currentUser: User
  }
  'joined-groups-res': { joinedGroups: ChatGroupJoind[] }
}

// 最终封装：服务端返回消息结构（支持 requestId 用于响应识别）
export interface ServerToClientMessage<T extends keyof ServerMessagePayloadMap = keyof ServerMessagePayloadMap> {
  type: T
  payload: ServerMessagePayloadMap[T]
  requestId?: string
}

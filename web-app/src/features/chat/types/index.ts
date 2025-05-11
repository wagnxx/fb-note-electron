// 单条消息结构（服务端统一使用）
export interface Message {
  id: string
  type: 'text' | 'image' | 'file'
  sender: string
  groupId: string
  content: string
  timestamp: number
}

// 群组结构
export type Group = {
  id: string
  name: string
  members: ClientMeta[]
  admin: string
  messages: Message[]
}

// WebSocket 连接用户的状态
export interface ClientMeta {
  username: string
  groupId: string
  userId: string
  socket: WebSocket
  joined: boolean
}

// ===================== 客户端 → 服务端 =====================

export type ClientMessage =
  | {
      type: 'join'
      username: string
      groupId: string
      userId: string
    }
  | {
      type: 'group-init'
      groups: Group[]
    }
  | {
      type: 'group-create'
      group: Group
    }
  | {
      type: 'group-req'
    }
// | {
//     type: 'message'
//     sender: string
//     groupId: string
//     content: string
//     fileName?: string
//     fileType?: string
//   }

// ===================== 服务端 → 客户端 =====================

export type ServerMessage =
  | {
      type: 'system'
      message: string
    }
  | {
      type: 'group-res'
      groups: Group[]
      timestamp: number
    }
  | Message // 普通群消息（含 text / image / file）

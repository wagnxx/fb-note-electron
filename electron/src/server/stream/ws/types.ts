import { WebSocket } from 'ws'

export type {
  ChatGroup as Group,
  ChatClientMetaBase as ClientMeta,
  ServerToClientMessage,
  ChatMessage,
  ClientToServerMessage,
} from '@shared/types'
import { User as PureUser } from '@shared/types'

export type User = PureUser & {
  socket?: WebSocket | null
}

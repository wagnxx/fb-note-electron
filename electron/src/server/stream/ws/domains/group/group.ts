// domains/group/Group.ts
import { ServerToClientMessage, User } from '../../interfaces/types'
import { WebSocket } from 'ws'

export class Group {
  constructor(
    public id: string,
    public name: string = '',
    public admin: string = '',
  ) {}

  setAdmin(userId: string) {
    this.admin = userId
  }

  rename(name: string) {
    this.name = name
  }

  // broadcast 委托 user 查找器
  broadcast(message: ServerToClientMessage, users: User[]) {
    const payload = JSON.stringify(message)

    users.forEach(user => {
      if (user.socket?.readyState === WebSocket.OPEN) {
        user.socket.send(payload)
      }
    })
  }
}

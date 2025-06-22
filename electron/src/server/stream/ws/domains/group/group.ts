// domains/group/Group.ts
import { Group as PrismaGroup } from '@prisma/client'
export class Group {
  constructor(
    public id: string,
    public name: string = '',
    public admin: string = '',
    public memberIds?: string[],
  ) {}

  setAdmin(userId: string) {
    this.admin = userId
  }

  rename(name: string) {
    this.name = name
  }

  static fromPrisma(data: PrismaGroup): Group {
    return new Group(data.id, data.name, data.admin)
  }

  // broadcast 委托 user 查找器
  // broadcast(message: ServerToClientMessage, users: User[]) {
  //   const payload = JSON.stringify(message)

  //   users.forEach(user => {
  //     if (user.socket?.readyState === WebSocket.OPEN) {
  //       user.socket.send(payload)
  //     }
  //   })
  // }
}

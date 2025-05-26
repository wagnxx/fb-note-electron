// services/userService.ts
import { PartialWithRequiredId } from '@/utils/types'
import { User } from '../types'
import { WebSocket } from 'ws'

export type UpdateUserProps = Omit<User, 'online'> & PartialWithRequiredId<User, 'id' | 'socket'>

export class UserService {
  private users = new Map<string, User>()

  addOrUpdateUser(user: UpdateUserProps) {
    const curUser = this.users.get(user.id)

    if (!curUser) {
      this.users.set(user.id, { ...user, online: true })
    } else {
      this.users.set(user.id, { ...curUser, ...user, online: true })
    }

    const afterSet = this.users.get(user.id)
    user?.socket?.send(JSON.stringify({ ...afterSet, type: 'reset-user-success' }))
  }

  markOffline(userId: string) {
    const user = this.users.get(userId)
    if (user) {
      user.online = false
      user.socket = null
    }
  }

  hasRegisterName(id: string) {
    const user = this.getUser(id)

    return !!user?.name
  }

  getUser(id: string): User | undefined {
    return this.users.get(id)
  }

  getOnlineUsers(): User[] {
    return Array.from(this.users.values()).filter(u => u.online)
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values())
  }
}

export const userService = new UserService()

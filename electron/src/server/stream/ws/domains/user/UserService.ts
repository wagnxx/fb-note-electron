// domains/user/UserService.ts

import { inject, injectable, TYPES } from '../../core/ioc.config'
import { IUserService } from '../../interfaces/services/IUserService'
import { User } from './User'
import { UserRepository } from './UserRepository'
import { WebSocket } from 'ws'

@injectable()
export class UserService implements IUserService {
  private repo: UserRepository

  constructor() {
    this.repo = new UserRepository()
  }

  registerUser(params: { id: string; name?: string; socket?: WebSocket | null; avatar?: string }): User {
    const user = new User(params)
    this.repo.save(user)
    return user
  }

  updateUser(id: string, data: Partial<Omit<User, 'id'>>) {
    const user = this.repo.getById(id)
    if (user) {
      user.update(data)
      this.repo.save(user)
    }
  }
  addOrUpdateUser(id: string, data: Partial<Omit<User, 'id'>>) {
    const user = this.repo.getById(id)
    if (user) {
      this.updateUser(id, data)
      return
    }
    this.registerUser({ id, name: data.name, socket: data.socket, avatar: data.avatar })
  }

  removeUser(id: string) {
    this.repo.remove(id)
  }

  getUser(id: string): User | undefined {
    return this.repo.getById(id)
  }
  getAllUsers(): User[] {
    return this.repo.getAll()
  }

  getOnlineUsers(): User[] {
    return this.repo.getOnlineUsers()
  }

  hasRegisteredName(id: string): boolean {
    return this.repo.hasRegisteredName(id)
  }
}

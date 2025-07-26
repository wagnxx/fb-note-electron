// domains/user/UserService.ts

import { inject, provide, TYPES } from '../../core/ioc.config'
import { WebSocketManager } from '../../core/WebSocketManager'
import { IUserService } from '../../interfaces/services/IUserService'
import { User } from './User'
import { UserRepository } from './UserRepository'

@provide(TYPES.UserService)
export class UserService implements IUserService {
  private readonly repo = new UserRepository() // ✅ 手动 new，容器不管

  constructor(@inject(TYPES.WebSocketManager) private wsManager: WebSocketManager) {}

  getUserGroups(id: string) {
    return this.repo.getUserGroups(id)
  }

  async registerUser(params: { id: string; name?: string; avatar?: string }) {
    const user = new User(params)
    await this.repo.save(user)
  }

  async updateUser(id: string, data: Partial<Omit<User, 'id'>>) {
    const user = await this.repo.getById(id)
    if (user) {
      user.update(data)
      await this.repo.save(user)
    }
  }
  async addOrUpdateUser(id: string, data: Partial<Omit<User, 'id'>>) {
    const user = await this.repo.getById(id)
    if (user) {
      await this.updateUser(id, data)
      return
    }
    await this.registerUser({ id, name: data?.name || void 0, avatar: data?.avatar || void 0 })
  }

  removeUser(id: string) {
    this.repo.remove(id)
  }

  async getUser(id: string): Promise<User | undefined> {
    return (await this.repo.getById(id)) ?? undefined
  }

  async getAllUsers() {
    const users = await this.repo.getAll()
    users.forEach(item => {
      item.online = this.wsManager.isOnline(item.id) || false
    })

    // 按 online 排序，true 在前
    users.sort((a, b) => Number(b.online) - Number(a.online))

    return users
  }

  getOnlineUsers() {
    return this.repo.getOnlineUsers()
  }

  hasRegisteredName(id: string) {
    return this.repo.hasRegisteredName(id)
  }
}

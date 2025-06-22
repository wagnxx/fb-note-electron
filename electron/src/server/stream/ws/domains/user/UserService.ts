// domains/user/UserService.ts

import { provide, TYPES } from '../../core/ioc.config'
import { IUserService } from '../../interfaces/services/IUserService'
import { User } from './User'
import { UserRepository } from './UserRepository'

@provide(TYPES.UserService)
export class UserService implements IUserService {
  // private repo: UserRepository
  private readonly repo = new UserRepository() // ✅ 手动 new，容器不管

  constructor() {
    // @inject(TYPES.UserRepository) private repo: UserRepository
    // this.repo = new UserRepository()
  }
  getGroups(id: string) {
    return this.repo.getGroups(id)
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

  getAllUsers() {
    return this.repo.getAll()
  }

  getOnlineUsers() {
    return this.repo.getOnlineUsers()
  }

  hasRegisteredName(id: string) {
    return this.repo.hasRegisteredName(id)
  }
}

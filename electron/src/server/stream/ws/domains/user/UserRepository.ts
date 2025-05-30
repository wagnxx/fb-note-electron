// domains/user/UserRepository.ts
import { inject, injectable, TYPES } from '../../core/ioc.config'
import { User } from './User'
@injectable()
export class UserRepository {
  private users = new Map<string, User>()

  save(user: User) {
    this.users.set(user.id, user)
  }

  getById(id: string): User | undefined {
    return this.users.get(id)
  }

  remove(id: string) {
    this.users.delete(id)
  }

  getAll(): User[] {
    return Array.from(this.users.values())
  }

  getOnlineUsers(): User[] {
    return this.getAll().filter(user => user.online)
  }

  hasRegisteredName(id: string): boolean {
    const user = this.users.get(id)
    return !!user?.name
  }
}

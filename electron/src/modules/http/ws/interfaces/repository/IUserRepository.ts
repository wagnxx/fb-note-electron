import { User } from '../../domains/user/User'

export interface IUserRepository {
  save(user: User): void
  getById(id: string): User | undefined
  remove(id: string): void
  getAll(): User[]
  getOnlineUsers(): User[]
  hasRegisteredName(id: string): boolean
}

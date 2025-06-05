// domains/user/UserService.ts

import { WebSocket } from 'ws'
import { User } from '../../domains/user/User'

export interface IUserService {
  registerUser(params: { id: string; name?: string; socket?: WebSocket | null; avatar?: string }): User

  updateUser(id: string, data: Partial<Omit<User, 'id'>>): void
  addOrUpdateUser(id: string, data: Partial<Omit<User, 'id'>>): void

  removeUser(id: string): void

  getUser(id: string): User | undefined
  getAllUsers(): User[]

  getOnlineUsers(): User[]

  hasRegisteredName(id: string): boolean
}

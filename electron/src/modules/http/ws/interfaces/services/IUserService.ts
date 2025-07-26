// domains/user/UserService.ts

import { WebSocket } from 'ws'
import { User } from '../../domains/user/User'
import { Prisma } from '.prisma/client'
// import { Group } from '../../domains/group/group'

type GroupWithRelations = Prisma.GroupGetPayload<{
  include: {
    members: true
  }
}>

export interface IUserService {
  registerUser(params: { id: string; name?: string; socket?: WebSocket | null; avatar?: string }): void

  updateUser(id: string, data: Partial<Omit<User, 'id'>>): void
  addOrUpdateUser(id: string, data: Partial<Omit<User, 'id'>>): void

  removeUser(id: string): void

  getUser(id: string): Promise<User | undefined>
  getUserGroups(id: string): Promise<GroupWithRelations[] | null>
  getAllUsers(): Promise<User[]>

  getOnlineUsers(): Promise<User[]>

  hasRegisteredName(id: string): Promise<boolean>
}

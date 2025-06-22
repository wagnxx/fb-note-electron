// domains/user/UserRepository.ts
import prisma from '@/prisma/prismaClient'
import { provide, TYPES } from '../../core/ioc.config'
import { User } from './User'
import { Group } from '../group/group'

@provide(TYPES.UserRepository)
export class UserRepository {
  private users = new Map<string, User>()

  save(user: User) {
    // this.users.set(user.id, user)
    return prisma.user.upsert({
      where: { id: user.id },
      update: {
        name: user.name,
        avatar: user.avatar,
        online: user.online,
      },
      create: {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        online: user.online,
      },
    })
  }

  async getById(id: string): Promise<User | null> {
    const dbUser = await prisma.user.findUnique({ where: { id } })
    if (!dbUser) return null
    return new User({
      id: dbUser.id,
      name: dbUser.name ?? undefined,
      avatar: dbUser.avatar ?? undefined,
      socket: null, // socket 不存数据库，初始化为 null
    })
  }

  remove(id: string) {
    // this.users.delete(id)
    prisma.user.delete({ where: { id } })
  }

  async getGroups(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { groups: true },
    })
    if (!user) return null
    return user.groups as Group[]
  }

  async getAll(): Promise<User[]> {
    const dbUsers = await prisma.user.findMany()
    return dbUsers.map(
      dbUser =>
        new User({
          id: dbUser.id,
          name: dbUser.name ?? undefined,
          avatar: dbUser.avatar ?? undefined,
          socket: null,
        }),
    )
  }

  async getOnlineUsers(): Promise<User[]> {
    const dbUsers = await prisma.user.findMany({ where: { online: true } })
    return dbUsers.map(
      dbUser =>
        new User({
          id: dbUser.id,
          name: dbUser.name ?? undefined,
          avatar: dbUser.avatar ?? undefined,
          socket: null,
        }),
    )
  }

  async hasRegisteredName(id: string): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { id }, select: { name: true } })
    return !!user?.name
  }
}

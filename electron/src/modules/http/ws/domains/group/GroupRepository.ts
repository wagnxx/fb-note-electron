// domains/group/GroupRepository.ts
import prisma from '@/prisma/prismaClient'
import { Group } from './group'
// @injectable()
export class GroupRepository {
  // private groups = new Map<string, Group>()

  async get(id: string) {
    // return this.groups.get(id)
    // return prisma.group.findUnique({ where: { id } })
    const data = await prisma.group.findUnique({ where: { id } })
    return data ? Group.fromPrisma(data) : null // 转换为领域模型
  }

  async save(group: Group) {
    // this.groups.set(group.id, group)
    console.log('正在写入 group 数据:', group)
    await prisma.group.upsert({
      where: { id: group.id },
      create: group,
      update: group,
    })
    console.log('✅ group 数据写入完毕')
  }

  async addUserToGroup(userId: string, groupId: string) {
    return await prisma.group.update({
      where: { id: groupId },
      data: {
        members: {
          connect: { id: userId }, // 只连接已有用户
        },
      },
    })
  }

  exists(id: string) {
    // return this.groups.has(id)
    return prisma.group.findUnique({ where: { id } })
  }

  async getGroups(ids: string[]): Promise<Group[]> {
    const groups = await prisma.group.findMany({
      where: { id: { in: ids } },
    })

    return groups.map(group => new Group(group.id, group.name, group.admin))
  }

  getGroupWidthMembers(groupId: string) {
    return prisma.group.findUnique({
      where: { id: groupId },
      include: { members: true },
    })
  }

  async getAll(includeMembers: boolean = false): Promise<Group[]> {
    const groupRecords = await prisma.group.findMany({
      include: { members: includeMembers },
    })

    // return groupRecords

    return groupRecords.map(
      record => new Group(record.id, record.name, record.admin, record?.members?.map(user => user.id) || []),
    )
  }

  async init(groups: Group[]): Promise<void> {
    // 使用事务批量执行 upsert 操作
    await prisma.$transaction(
      groups.map(group =>
        prisma.group.upsert({
          where: { id: group.id }, // 根据ID判断是否存在
          create: group, // 不存在则创建
          update: {}, // 存在则不做任何更新（保持原样）
        }),
      ),
    )
  }

  clear() {
    this.disconnect()
  }

  // 可选：关闭 Prisma 连接
  async disconnect(): Promise<void> {
    await prisma.$disconnect()
  }
}

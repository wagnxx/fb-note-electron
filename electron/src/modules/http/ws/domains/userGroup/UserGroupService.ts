// domains/userGroup/UserGroupService.ts
import prisma from '@/prisma/prismaClient'
import { provide, TYPES } from '../../core/ioc.config'
import { IUserGroupService } from './IUserGroupService'
@provide(TYPES.UserGroupService)
export class UserGroupService implements IUserGroupService {
  private groupMembers = new Map<string, Set<string>>()
  private userGroups = new Map<string, Set<string>>()

  addUserToGroup(userId: string, groupId: string): void {
    prisma.group.update({
      where: { id: groupId },
      data: {
        members: {
          connect: { id: userId },
        },
      },
    })
  }

  addUserToGroup_local(userId: string, groupId: string): void {
    if (!this.groupMembers.has(groupId)) {
      this.groupMembers.set(groupId, new Set())
    }
    this.groupMembers.get(groupId)!.add(userId)

    if (!this.userGroups.has(userId)) {
      this.userGroups.set(userId, new Set())
    }
    this.userGroups.get(userId)!.add(groupId)
  }

  async getUsersByGroup(groupId: string) {
    // return Array.from(this.groupMembers.get(groupId) ?? [])
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { members: true },
    })
    if (!group) {
      return []
    }
    return group.members.map(user => user.id)
  }

  async getGroupsByUser(userId: string): Promise<string[]> {
    // return Array.from(this.userGroups.get(userId) ?? [])
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { groups: true },
    })

    if (!user) return []

    return user.groups.map(group => group.id)
  }
}

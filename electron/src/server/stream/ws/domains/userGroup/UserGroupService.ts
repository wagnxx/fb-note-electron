// domains/userGroup/UserGroupService.ts
import { inject, injectable, TYPES } from '../../core/ioc.config'
import { IUserGroupService } from './IUserGroupService'
@injectable()
export class UserGroupService implements IUserGroupService {
  private groupMembers = new Map<string, Set<string>>()
  private userGroups = new Map<string, Set<string>>()

  addUserToGroup(userId: string, groupId: string): void {
    if (!this.groupMembers.has(groupId)) {
      this.groupMembers.set(groupId, new Set())
    }
    this.groupMembers.get(groupId)!.add(userId)

    if (!this.userGroups.has(userId)) {
      this.userGroups.set(userId, new Set())
    }
    this.userGroups.get(userId)!.add(groupId)
  }

  getUsersByGroup(groupId: string): string[] {
    return Array.from(this.groupMembers.get(groupId) ?? [])
  }

  getGroupsByUser(userId: string): string[] {
    return Array.from(this.userGroups.get(userId) ?? [])
  }
}

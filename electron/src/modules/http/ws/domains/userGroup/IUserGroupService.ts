// domains/userGroup/IUserGroupService.ts
export interface IUserGroupService {
  addUserToGroup(userId: string, groupId: string): void
  getUsersByGroup(groupId: string): Promise<string[]>
  getGroupsByUser(userId: string): Promise<string[]>
}

export interface IUserGroupService {
  addUserToGroup(userId: string, groupId: string): void

  getUsersByGroup(groupId: string): string[]

  getGroupsByUser(userId: string): string[]
}

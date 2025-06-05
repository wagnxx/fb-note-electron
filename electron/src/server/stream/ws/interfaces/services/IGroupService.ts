import { ChatGroupWithMember } from '@shared/types'
import { Group } from '../../domains/group/group'
import { Group as GroupDTO, ServerToClientMessage, User } from '../types'

// interfaces/services/IGroupService.ts
export interface IGroupService {
  initGroups(groups: GroupDTO[]): void
  setGroup(params: { id: string; name?: string; admin?: string }): void
  getOrCreateGroup(id: string): Group
  addMember(groupId: string, userId: string): void
  broadcast(groupId: string, message: ServerToClientMessage): void
  getGroup(id: string): Group | undefined
  getGroups(ids: string[]): Group[]
  getAllGroups(): Group[]
  getAllGroupsWithMembers(): ChatGroupWithMember[]
  getSystemId(): string

  getGroupsWithMembers(userId: string): (GroupDTO & { members: User[] })[]
}

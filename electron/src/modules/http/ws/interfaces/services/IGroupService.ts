import { Group } from '../../domains/group/group'
import { ChatGroupWithMember, Group as GroupDTO, ServerToClientMessage } from '../types'

// interfaces/services/IGroupService.ts
export interface IGroupService {
  initGroups(groups: GroupDTO[]): void
  setGroup(params: { id: string; name?: string; admin?: string }): void
  getOrCreateGroup(id: string): Promise<Group>
  addMember(groupId: string, userId: string): void
  removeMember(groupId: string, userId: string): void
  broadcast(groupId: string, message: ServerToClientMessage): void
  getGroup(id: string): Promise<Group | null>
  getGroups(ids: string[]): Promise<Group[]>
  getAllGroups(): Promise<Group[]>
  getAllGroupsWithMembers(): Promise<ChatGroupWithMember[]>
  getSystemId(): string

  getGroupsWithMembers(userId: string): Promise<ChatGroupWithMember[]>
}

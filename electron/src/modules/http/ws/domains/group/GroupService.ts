// domains/group/GroupService.ts
import { Group } from './group'
import { GroupRepository } from './GroupRepository'
import type { ServerToClientMessage, User, Group as GroupDTO, ChatGroupWithMember } from '../../interfaces/types'
import { inject, provide, TYPES } from '../../core/ioc.config'
import { IGroupService } from '../../interfaces/services/IGroupService'
import { IUserService } from '../../interfaces/services/IUserService'
import { WebSocketManager } from '../../core/WebSocketManager'

@provide(TYPES.GroupService)
export class GroupService implements IGroupService {
  private inited = false
  private systemId = 'sys'
  private readonly repo: GroupRepository

  constructor(
    // @inject(TYPES.UserGroupService) private readonly userGroupService: IUserGroupService,
    @inject(TYPES.UserService) private readonly userService: IUserService,
    @inject(TYPES.WebSocketManager) private readonly wsManage: WebSocketManager,
  ) {
    this.repo = new GroupRepository()

    const systemGroup = new Group('sys', 'SystemGroup')
    this.repo.save(systemGroup)
  }
  getAllGroups(): Promise<Group[]> {
    throw new Error('Method not implemented.')
  }

  initGroups(groups: GroupDTO[]) {
    if (this.inited) return
    const groupEntities = groups.map(g => new Group(g.id, g.name, g.admin))
    this.repo.init(groupEntities)
    this.inited = true
  }

  setGroup(params: { id: string; name?: string; admin?: string }) {
    const group = new Group(params.id, params.name, params.admin)
    this.repo.save(group)
  }

  async getOrCreateGroup(id: string) {
    let group = await this.repo.get(id)
    if (!group) {
      group = new Group(id)
      await this.repo.save(group as Group)
    }
    return group as Group
  }

  addMember(groupId: string, userId: string) {
    // this.userGroupService.addUserToGroup(userId, groupId)
    return this.repo.addUserToGroup(userId, groupId)
  }

  async broadcast(groupId: string, message: ServerToClientMessage) {
    const group = await this.repo.getGroupWidthMembers(groupId)
    if (!group?.members) return

    // const members = this.userGroupService
    //   .getUsersByGroup(groupId)
    //   .map(id => this.userService.getUser(id) as User | undefined)
    // .filter((u): u is User => !!u)

    // group.broadcast(message, members)
    this.wsManage.sendToUsers(
      group.members.map(item => item.id),
      message,
    )
  }

  getGroup(id: string) {
    return this.repo.get(id)
  }
  getGroups(ids: string[]) {
    return this.repo.getGroups(ids)
  }

  async getAllGroupsWithMembers() {
    const allGroups = await this.repo.getAll(true)
    const allUsers = await this.userService.getAllUsers()
    const result: ChatGroupWithMember[] = allGroups.map(item => ({
      id: item.id,
      name: item.name,
      admin: item.admin,
      members: (item.memberIds?.map(uid => allUsers.find(user => user.id === uid)).filter(Boolean) as User[]) || [],
    }))

    return result
  }

  getSystemId() {
    return this.systemId
  }
  // 辅助方法：查找群组成员
  private findMember = () => {
    // const membersId = this.userGroupService.getUsersByGroup(item.id)
    // const members = membersId.map(uid => this.userService.getUser(uid)) as User[]
    // return {
    //   ...item,
    //   members,
    // }
  }
  async getGroupsWithMembers(userId: string) {
    const groups = await this.userService.getUserGroups(userId)
    if (!groups) return []
    return groups
  }
}

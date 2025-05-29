// domains/group/GroupService.ts
import { Group } from './group'
import { GroupRepository } from './GroupRepository'
import type { ServerToClientMessage, User, Group as GroupDTO, JoinedGroupResponse } from '../../types'
import type { UserGroupService } from '../userGroup/UserGroupService'
import type { UserService } from '../user/UserService'
import { MessageService } from '../message/MessageService'

export class GroupService {
  // private repo: GroupRepository
  // private userGroupService: UserGroupService
  // private userService: UserService
  private inited = false

  private systemId = 'sys'

  constructor(
    private readonly repo: GroupRepository,
    private readonly userGroupService: UserGroupService,
    private readonly userService: UserService,
    private readonly messageService: MessageService,
  ) {
    // this.repo = repo
    // this.userGroupService = userGroupService
    // this.userService = userService
    // this.messageService = messageService

    const systemGroup = new Group('sys', 'SystemGroup')
    this.repo.save(systemGroup)
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

  getOrCreateGroup(id: string) {
    let group = this.repo.get(id)
    if (!group) {
      group = new Group(id)
      this.repo.save(group)
    }
    return group
  }

  addMember(groupId: string, userId: string) {
    this.userGroupService.addUserToGroup(userId, groupId)
  }

  broadcast(groupId: string, message: ServerToClientMessage) {
    const group = this.repo.get(groupId)
    if (!group) return

    const members = this.userGroupService
      .getUsersByGroup(groupId)
      .map(id => this.userService.getUser(id) as User | undefined)
      .filter((u): u is User => !!u)

    group.broadcast(message, members)
  }

  getGroup(id: string) {
    return this.repo.get(id)
  }
  getGroups(ids: string[]) {
    return this.repo.getGroups(ids)
  }

  getAllGroups() {
    return this.repo.getAll()
  }

  getSystemId() {
    return this.systemId
  }
  // 辅助方法：查找群组成员
  private findMember = (item: Group) => {
    const membersId = this.userGroupService.getUsersByGroup(item.id)
    const members = membersId.map(uid => this.userService.getUser(uid)) as User[]
    return {
      ...item,
      members,
    }
  }
  private getGroupsWithMembers(userId: string) {
    const groupIds = this.userGroupService.getGroupsByUser(userId)
    const groups = this.getGroups(groupIds)
    const groupWithMembers = groups.map(this.findMember)
    return groupWithMembers
  }
  /**
   * 获取用户加入的群组及最新消息
   */
  public getJoinedGroupsWithLatestMessage(userId: string): JoinedGroupResponse[] {
    const groups = this.getGroupsWithMembers(userId)

    return groups.map(group => ({
      group,
      latestMessage: this.messageService.getLatestMessage(group.id), // 组合MessageService
    })) as JoinedGroupResponse[]
  }
}

import { WebSocket } from 'ws'
import { ChatMessage, ClientToServerMessage, Group, ServerToClientMessage } from '../interfaces/types'
import { UpdateUserProps } from '../interfaces/types'
import { getValidObject } from '@/utils/object'
import { GroupService } from '../domains/group/GroupService'
import { UserGroupService } from '../domains/userGroup/UserGroupService'
import { MessageService } from '../domains/message/MessageService'
import { BaseWsController } from './BaseWs'
import { action, inject, provide, TYPES } from '../core/ioc.config'
import { ICoordinatorService } from '../interfaces/services/ICoordinatorService'
import { IUserService } from '../interfaces/services/IUserService'

@provide(TYPES.GroupController)
export class GroupController extends BaseWsController {
  constructor(
    @inject(TYPES.GroupService) private readonly groupService: GroupService,
    @inject(TYPES.UserService) private readonly userService: IUserService,
    @inject(TYPES.UserGroupService) private readonly userGroupService: UserGroupService,
    @inject(TYPES.MessageService) private readonly messageService: MessageService,
    @inject(TYPES.CoordinatorService) private readonly coordinatorService: ICoordinatorService,
  ) {
    super()
  }

  // =============================================  init     ==============================================
  @action('init-req')
  public handleInitRequest(ws: WebSocket, data: ClientToServerMessage & { type: 'init-req' }) {
    const userId = data.id
    this.updateUser(ws, userId, data)

    const payload: ServerToClientMessage = {
      type: 'init-res',
      joinedGroups: this.coordinatorService.getJoinedGroupsWithLatestMessage(userId),
      allGroups: this.groupService.getAllGroupsWithMembers(),
      allUsers: this.userService.getAllUsers(),
      currentUser: this.userService.getUser(userId)!,
    }
    ws.send(JSON.stringify(payload))
  }

  @action('group-init')
  public handleGroupInit(data: { groups: Group[] }) {
    this.groupService.initGroups(data.groups)
  }

  @action('group-create')
  public handleGroupCreate(ws: WebSocket, data: ClientToServerMessage & { type: 'group-create' }) {
    this.groupService.setGroup(data.group)
    console.log('Group created:', data.group)
    this.handleGroupRequest(ws)
  }

  @action('join')
  public handleJoinGroup(ws: WebSocket, data: ClientToServerMessage & { type: 'join' }) {
    const groupService = this.groupService
    const userService = this.userService
    const userGroupService = this.userGroupService
    const messageService = this.messageService

    const { username, groupId, userId } = data
    const group = groupService.getOrCreateGroup(groupId)!
    const systemId = groupService.getSystemId()

    // 添加成员
    groupService.addMember(groupId, userId)
    groupService.addMember(groupId, systemId)

    // 设置管理员
    if (!group.admin) {
      group.admin = username
    }

    // 注册用户
    if (!userService.hasRegisteredName(userId)) {
      userService.addOrUpdateUser(userId, { name: username, socket: ws })
    }

    userGroupService.addUserToGroup(userId, groupId)

    console.log(`👤 ${username} (userId: ${userId}) joined group [${groupId}]`)

    // 广播加入通知
    groupService.broadcast(groupId, {
      type: 'system',
      message: `${username} joined the chat.`,
    })

    // 发送更新后的群组列表

    const joinedGroups = this.coordinatorService.getJoinedGroupsWithLatestMessage(userId)
    const groupMessage: ServerToClientMessage = {
      type: 'joined-groups-res',
      joinedGroups,
    }
    groupService.broadcast(groupId, groupMessage)

    // 发送聊天历史
    const historyMessage: ServerToClientMessage = {
      type: 'message-history-res',
      groupId,
      messages: messageService.getMessages(groupId) as ChatMessage[],
    }
    ws.send(JSON.stringify(historyMessage))
  }

  @action('groups-req')
  public handleGroupRequest(ws: WebSocket) {
    const message: ServerToClientMessage = {
      type: 'groups-res',
      groups: this.groupService.getAllGroupsWithMembers(),
      timestamp: Date.now(),
    }
    ws.send(JSON.stringify(message))
  }

  // =============================================  user group     ==============================================
  @action('reset-user')
  public handleResetUser(ws: WebSocket, data: ClientToServerMessage & { type: 'reset-user' }) {
    const userId = data.id
    this.updateUser(ws, userId, data)

    const afterSet = this.userService.getUser(userId)
    ws.send(JSON.stringify({ ...afterSet, type: 'reset-user-success' }))
  }

  @action('users-req')
  public handleGetUsers(ws: WebSocket, _data: ClientToServerMessage & { type: 'users-req' }) {
    const users = this.userService.getAllUsers()
    ws.send(JSON.stringify({ type: 'users-res', users }))
  }

  @action('joined-groups-req')
  public handleGetJoindGroups(ws: WebSocket, data: ClientToServerMessage & { type: 'joined-groups-req' }) {
    const userId = data.id
    const payload: ServerToClientMessage = {
      type: 'joined-groups-res',
      joinedGroups: this.coordinatorService.getJoinedGroupsWithLatestMessage(userId),
    }
    ws.send(JSON.stringify(payload))
  }
  // =============================================   chat message     ==============================================
  @action('message-history-req')
  public handleGetGroupMessages(ws: WebSocket, data: ClientToServerMessage & { type: 'message-history-req' }) {
    const { groupId } = data
    if (!groupId) return

    const group = this.groupService.getGroup(groupId)
    if (!group) return

    const historyMessage: ServerToClientMessage = {
      type: 'message-history-res',
      groupId,
      messages: this.messageService.getMessages(groupId) as ChatMessage[],
    }
    ws.send(JSON.stringify(historyMessage))
  }

  @action('text')
  @action('image')
  @action('file')
  public handleMessage(ws: WebSocket, data: ChatMessage) {
    this.messageService.addRawMessage(data)
  }

  // =============================================   辅助方法     ==============================================

  // 更新用户信息（私有方法）
  private updateUser(ws: WebSocket, userId: string, data: ClientToServerMessage) {
    const params: UpdateUserProps = { id: userId, socket: ws }
    const user = getValidObject(data)
    this.userService.addOrUpdateUser(userId, { ...params, ...user })
  }
}

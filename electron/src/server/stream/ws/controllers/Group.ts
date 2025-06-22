import { WebSocket } from 'ws'
import { ChatMessage, ClientToServerMessage, Group, ServerToClientMessage } from '../interfaces/types'
import { getValidObject } from '@/utils/object'
import { GroupService } from '../domains/group/GroupService'
import { MessageService } from '../domains/message/MessageService'
import { BaseWsController } from './BaseWs'
import { action, inject, provide, TYPES } from '../core/ioc.config'
import { ICoordinatorService } from '../interfaces/services/ICoordinatorService'
import { IUserService } from '../interfaces/services/IUserService'
import { WebSocketManager } from '../core/WebSocketManager'

@provide(TYPES.GroupController)
export class GroupController extends BaseWsController {
  constructor(
    @inject(TYPES.GroupService) private readonly groupService: GroupService,
    @inject(TYPES.UserService) private readonly userService: IUserService,
    // @inject(TYPES.UserGroupService) private readonly userGroupService: UserGroupService,
    @inject(TYPES.MessageService) private readonly messageService: MessageService,
    @inject(TYPES.CoordinatorService) private readonly coordinatorService: ICoordinatorService,
    @inject(TYPES.WebSocketManager) private readonly wsManager: WebSocketManager,
  ) {
    super()
  }

  // =============================================  init     ==============================================
  @action('init-req')
  public async handleInitRequest(ws: WebSocket, data: ClientToServerMessage & { type: 'init-req' }) {
    const userId = data.id
    this.updateUser(ws, userId, data)

    const joinedGroups = await this.coordinatorService.getJoinedGroupsWithLatestMessage(userId)
    const allGroups = await this.groupService.getAllGroupsWithMembers()
    const allUsers = await this.userService.getAllUsers()
    const currentUser = await this.userService.getUser(userId)
    if (!currentUser) return

    const payload: ServerToClientMessage = {
      type: 'init-res',
      joinedGroups,
      allGroups,
      allUsers,
      currentUser,
    }
    this.wsManager.sendToUser({ ws }, payload)
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
  public async handleJoinGroup(ws: WebSocket, data: ClientToServerMessage & { type: 'join' }) {
    const groupService = this.groupService
    const userService = this.userService
    // const userGroupService = this.userGroupService
    const messageService = this.messageService

    const { username, groupId, userId } = data
    const group = await groupService.getOrCreateGroup(groupId)!
    const systemId = groupService.getSystemId()

    // 注册用户 , 现有用户记录才可以 执行addMember
    const reged = await userService.hasRegisteredName(userId)
    const systemIdReged = await userService.hasRegisteredName(systemId)
    if (!reged) {
      await userService.addOrUpdateUser(userId, { name: username })
    }
    if (!systemIdReged) {
      await userService.addOrUpdateUser(systemId, { name: systemId })
    }
    // 添加成员 到表里
    await groupService.addMember(groupId, userId)
    await groupService.addMember(groupId, systemId)

    // 设置管理员
    if (!group.admin) {
      group.admin = username
    }

    // userGroupService.addUserToGroup(userId, groupId)

    console.log(`👤 ${username} (userId: ${userId}) joined group [${groupId}]`)

    // 广播加入通知
    groupService.broadcast(groupId, {
      type: 'system',
      message: `${username} joined the chat.`,
    })

    // 发送更新后的群组列表

    const joinedGroups = await this.coordinatorService.getJoinedGroupsWithLatestMessage(userId)
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
    this.wsManager.sendToUser({ userId }, historyMessage)
  }

  @action('groups-req')
  public async handleGroupRequest(ws: WebSocket) {
    const groups = await this.groupService.getAllGroupsWithMembers()
    const message: ServerToClientMessage = {
      type: 'groups-res',
      groups,
      timestamp: Date.now(),
    }

    this.wsManager.sendToUser({ ws }, message)
  }

  // =============================================  user group     ==============================================
  @action('reset-user')
  public async handleResetUser(ws: WebSocket, data: ClientToServerMessage & { type: 'reset-user' }) {
    const userId = data.id
    await this.updateUser(ws, userId, data)

    const afterSet = await this.userService.getUser(userId)
    this.wsManager.sendToUser({ ws }, { ...afterSet!, type: 'reset-user-success' })
  }

  @action('users-req')
  public async handleGetUsers(ws: WebSocket, _data: ClientToServerMessage & { type: 'users-req' }) {
    const users = await this.userService.getAllUsers()
    ws.send(JSON.stringify({ type: 'users-res', users }))
  }

  @action('joined-groups-req')
  public async handleGetJoindGroups(ws: WebSocket, data: ClientToServerMessage & { type: 'joined-groups-req' }) {
    const userId = data.id
    const joinedGroups = await this.coordinatorService.getJoinedGroupsWithLatestMessage(userId)
    const payload: ServerToClientMessage = {
      type: 'joined-groups-res',
      joinedGroups,
    }
    this.wsManager.sendToUser({ userId }, payload)
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
    this.wsManager.sendToUser({ ws }, historyMessage)
  }

  @action('text')
  @action('image')
  @action('file')
  public handleMessage(ws: WebSocket, data: ChatMessage) {
    this.messageService.addRawMessage(data)
  }

  // =============================================   辅助方法     ==============================================

  // 更新用户信息（私有方法）
  private async updateUser(
    ws: WebSocket,
    userId: string,
    data: ClientToServerMessage & { type: 'init-req' | 'reset-user' },
  ) {
    // const params: UpdateUserProps = { id: userId, socket: ws }
    // const params: UpdateUserProps = { id: userId }
    const { type: _, id: _id, online: _online, ..._data } = data // ✅ 去掉 type 字段

    const user = getValidObject(_data)

    await this.userService.addOrUpdateUser(userId, { ...user })
  }
}

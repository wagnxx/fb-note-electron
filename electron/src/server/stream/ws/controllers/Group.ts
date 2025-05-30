import { WebSocket } from 'ws'

import {
  ChatMessage,
  ClientToServerMessage,
  Group,
  IMessageDispatcher,
  ServerToClientMessage,
  User,
} from '../interfaces/types'

import { UpdateUserProps } from '../interfaces/types'
import { getValidObject } from '@/utils/object'
import { GroupService } from '../domains/group/GroupService'
import { UserService } from '../domains/user/UserService'
import { UserGroupService } from '../domains/userGroup/UserGroupService'
import { MessageService } from '../domains/message/MessageService'
import { BaseWsController } from './BaseWs'
import { inject, injectable, TYPES } from '../core/ioc.config'

import { ICoordinatorService } from '../interfaces/services/ICoordinatorService'

@injectable()
export class GroupController extends BaseWsController {
  private readonly FUNCTION_COMMANDS = {
    getWifiIp: '@getWifiIp',
    getUsers: '@getUsers',
  }

  constructor(
    @inject(TYPES.MessageDispatcher)
    protected readonly dispatcher: IMessageDispatcher,
    @inject(TYPES.GroupService) private readonly groupService: GroupService,
    @inject(TYPES.UserService) private readonly userService: UserService,
    @inject(TYPES.UserGroupService) private readonly userGroupService: UserGroupService, // 确保这个参数存在
    @inject(TYPES.MessageService) private readonly messageService: MessageService,
    @inject(TYPES.CoordinatorService) private readonly coordinatorService: ICoordinatorService,
  ) {
    //
    super(dispatcher) // 必须调用父类构造函数
    // this.registerHandlers(this.dispatcher)
  }

  public registerHandlers(dispatcher: IMessageDispatcher) {
    //init
    dispatcher.on('init-req', (ws, data) => this.handleInitRequest(ws, data))

    // group
    dispatcher.on('group-init', (_, data) => this.handleGroupInit(data))
    dispatcher.on('group-create', (ws, data) => this.handleGroupCreate(ws, data))
    dispatcher.on('join', (ws, data) => this.handleJoinGroup(ws, data))
    dispatcher.on('groups-req', ws => this.handleGroupRequest(ws))
    // userGroup
    dispatcher.on('reset-user', (ws, data) => this.handleResetUser(ws, data))
    dispatcher.on('users-req', (ws, data) => this.handleGetUsers(ws, data))
    dispatcher.on('joined-groups-req', (ws, data) => this.handleGetJoindGroups(ws, data))
    // chat message
    dispatcher.on('message-history-req', (ws, data) => this.handleGetGroupMessages(ws, data))
    dispatcher.on('text', (_, data) => this.handleMessage(data))
    dispatcher.on('image', (_, data) => this.handleMessage(data))
    dispatcher.on('file', (_, data) => this.handleMessage(data))
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

  // 更新用户信息（私有方法）
  private updateUser(ws: WebSocket, userId: string, data: ClientToServerMessage) {
    const params: UpdateUserProps = { id: userId, socket: ws }
    const user = getValidObject(data)
    this.userService.addOrUpdateUser(userId, { ...params, ...user })
  }

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

  public handleGroupInit(data: { groups: Group[] }) {
    this.groupService.initGroups(data.groups)
  }

  public handleGroupCreate(ws: WebSocket, data: ClientToServerMessage & { type: 'group-create' }) {
    this.groupService.setGroup(data.group)
    console.log('Group created:', data.group)
    this.handleGroupRequest(ws)
  }

  public handleGroupRequest(ws: WebSocket) {
    const message: ServerToClientMessage = {
      type: 'groups-res',
      groups: [...this.groupService.getAllGroups().values()].map(this.findMember),
      timestamp: Date.now(),
    }
    ws.send(JSON.stringify(message))
  }

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

  public handleInitRequest(ws: WebSocket, data: ClientToServerMessage & { type: 'init-req' }) {
    const userId = data.id
    this.updateUser(ws, userId, data)

    const userUpdated = this.userService.getUser(userId)
    const allGroups = this.groupService.getAllGroups()
    const allUsers = this.userService.getAllUsers()

    const payload: ServerToClientMessage = {
      type: 'init-res',
      joinedGroups: this.coordinatorService.getJoinedGroupsWithLatestMessage(userId),
      allGroups: allGroups.map(this.findMember),
      allUsers,
      currentUser: userUpdated!,
    }
    ws.send(JSON.stringify(payload))
  }

  public handleResetUser(ws: WebSocket, data: ClientToServerMessage & { type: 'reset-user' }) {
    const userId = data.id
    this.updateUser(ws, userId, data)

    const afterSet = this.userService.getUser(userId)
    ws.send(JSON.stringify({ ...afterSet, type: 'reset-user-success' }))
  }

  public handleGetJoindGroups(ws: WebSocket, data: ClientToServerMessage & { type: 'joined-groups-req' }) {
    const userId = data.id
    const payload: ServerToClientMessage = {
      type: 'joined-groups-res',
      joinedGroups: this.coordinatorService.getJoinedGroupsWithLatestMessage(userId),
    }
    ws.send(JSON.stringify(payload))
  }
  public handleGetUsers(ws: WebSocket, data: ClientToServerMessage & { type: 'users-req' }) {
    const users = this.userService.getAllUsers()
    ws.send(JSON.stringify({ type: 'users-res', users }))
  }

  public handleMessage(data: ChatMessage) {
    this.messageService.addRawMessage(data)
  }
}

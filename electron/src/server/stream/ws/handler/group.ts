import { getNetworkInfo } from '@/utils/netUtils'
import { groupService, userService } from '../manages/context'
import { ChatMessage, ClientMeta, ClientToServerMessage, ServerToClientMessage, User } from '../types'
import { WebSocket } from 'ws'
import { UpdateUserProps } from '../services/user'
import { getValidObject } from '@/utils/object'

const FUNCTION_COMMANDS = {
  getWifiIp: '@getWifiIp',
  getUsers: '@getUsers',
}

export const handleJoinGroup = (ws: WebSocket, data: any) => {
  const { username, groupId, userId } = data
  const client: ClientMeta = { userId, username, groupId, socket: ws }
  const group = groupService.getOrCreateGroup(groupId)!
  const systemClient = groupService.getSystemClient()
  const systemClientScope = { ...systemClient, groupId }
  group.members.push(client)
  group.members.push(systemClientScope)

  if (!group.admin) group.admin = username

  if (!userService.hasRegisterName(userId)) {
    userService.addOrUpdateUser({ id: userId, name: username })
  }

  console.log(`👤 ${username} (userId: ${userId}) joi ned group [${groupId}]`)
  groupService.broadcast(groupId, { type: 'system', message: `${username} joined the chat.` })

  // update groups
  const groups = groupService.getAllGroups()
  const message: ServerToClientMessage = {
    type: 'group-res',
    timestamp: Date.now(),
    groups: [...groups.values()],
  }
  groupService.broadcast(groupId, message)
  // response chat history
  const historyMessage: ServerToClientMessage = {
    type: 'message-history-res',
    groupId,
    messages: groups.get(groupId)?.messages || [],
  }
  ws.send(JSON.stringify(historyMessage))
}

export const handleGroupInit = (data: any) => {
  groupService.initGroups(data)
}

export const handleGroupCreate = (ws: WebSocket, data: any) => {
  groupService.setGroup(data.group.id, data.group)
  console.log('Group created:', data.group)
  handleGroupRequest(ws)
}

// 处理群组请求
export const handleGroupRequest = (ws: WebSocket) => {
  const message = {
    type: 'group-res',
    groups: [...groupService.getAllGroups().values()],
    timestamp: Date.now(),
  }
  const payload = JSON.stringify(message)
  ws.send(payload)
}

// 处理群组请求
export const handleGetGroupMessages = (ws: WebSocket, data: any) => {
  const groupId = data.groupId
  if (!groupId) return
  const group = groupService.getGroup(groupId)
  if (!group) return

  const historyMessage: ServerToClientMessage = {
    type: 'message-history-res',
    groupId,
    messages: group?.messages || [],
  }
  ws.send(JSON.stringify(historyMessage))
}

export const handleResetUser = (ws: WebSocket, data: ClientToServerMessage) => {
  if (data.type !== 'reset-user') return

  groupService.resetUser(ws, data)

  let params: UpdateUserProps = { id: data.id, socket: ws }
  const user = getValidObject(data)

  // if (data.name) {
  //   userService.addOrUpdateUser({ id: data.id, name: data.name, socket: ws })
  //   params.name = data.name
  // } else if (data.avatar) {
  //   params.avatar = data.avatar
  // }
  userService.addOrUpdateUser({ ...params, ...user })
}
export const handleGetUser = (ws: WebSocket, data: ClientToServerMessage) => {
  if (data.type !== 'user-req') return

  const users = userService.getAllUsers()
  ws.send(JSON.stringify({ type: 'user-res', users }))
}

// 处理消息发送
export const handleMessage = (data: any) => {
  const { content, fileName, fileType, sender, groupId, id } = data

  // 构建消息对象
  let message: ChatMessage

  if (fileName && fileType) {
    // 文件消息
    message = {
      id,
      type: 'file',
      sender,
      groupId,
      content,
      timestamp: Date.now(),
      fileName,
      fileType,
    }
  } else {
    // 文本消息
    message = {
      id,
      type: 'text',
      sender,
      groupId,
      content,
      timestamp: Date.now(),
    }
  }

  // 保存并广播
  const group = groupService.getGroup(groupId)
  if (!group) return

  group.messages.push(message)
  groupService.broadcast(groupId, message)

  // 指令消息处理
  if (message.type === 'text' && content === FUNCTION_COMMANDS.getWifiIp) {
    const senderUser = group.members.find(user => user.userId === sender)
    if (!senderUser) return

    const systemClient = groupService.getSystemClient()

    getNetworkInfo().then(({ ip, gateway }) => {
      const resContent =
        `@${senderUser.username}\n` +
        `Your IP Address: ${ip || 'Unknown'}\n` +
        `Router Address: ${gateway || 'Unknown'}\n` +
        `Make sure other devices are connected to the same network segment.`

      const funcMessage: ChatMessage = {
        id: `${id}-sys-resp`,
        type: 'text',
        sender: systemClient.userId,
        groupId,
        content: resContent,
        timestamp: Date.now(),
      }

      group.messages.push(funcMessage)
      groupService.broadcast(groupId, funcMessage)
    })
  }
}

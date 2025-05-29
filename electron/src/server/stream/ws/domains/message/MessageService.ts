// domains/message/MessageService.ts
import { MessageRepository } from './MessageRepository'
import { TextMessage, FileMessage, ImageMessage, Message } from './Message'
import { GroupService } from '../group/GroupService'
import { UserService } from '../user/UserService'
import { getNetworkInfo } from '@/utils/netUtils'
import { ServerToClientMessage } from '../../types'

const FUNCTION_COMMANDS = {
  getWifiIp: '@getWifiIp',
  getUsers: '@getUsers',
}

export class MessageService {
  private groupService?: GroupService // 声明为可选

  constructor(
    private messageRepository: MessageRepository,
    // private groupService: GroupService,
    private userService: UserService,
  ) {
    //
  }

  setGroupService(groupService: GroupService) {
    this.groupService = groupService
  }

  async addRawMessage(data: {
    id: string
    groupId: string
    sender: string
    content: string
    type: 'text' | 'file' | 'image'
    timestamp?: number
    fileName?: string
    fileType?: string
  }): Promise<void> {
    const { id, groupId, sender, content, type, timestamp = Date.now(), fileName, fileType } = data

    const group = this?.groupService?.getGroup(groupId)
    if (!group) return

    let message
    switch (type) {
      case 'file':
        if (!fileName || !fileType) return
        message = new FileMessage(id, groupId, sender, timestamp, content, fileName, fileType)
        break
      case 'image':
        message = new ImageMessage(id, groupId, sender, timestamp, content)
        break
      default:
        message = new TextMessage(id, groupId, sender, timestamp, content)
    }

    this.messageRepository.add(message)
    this?.groupService?.broadcast(groupId, message as ServerToClientMessage)

    // 处理特殊指令
    if (type === 'text' && content === FUNCTION_COMMANDS.getWifiIp) {
      const senderUser = this.userService.getUser(sender)
      if (!senderUser) return

      const systemId = this?.groupService?.getSystemId()
      if (!systemId) return
      const { ip, gateway } = await getNetworkInfo()

      const resContent =
        `@${senderUser.name}\n` +
        `Your IP Address: ${ip || 'Unknown'}\n` +
        `Router Address: ${gateway || 'Unknown'}\n` +
        `Make sure other devices are connected to the same network segment.`

      const funcMessage = new TextMessage(`${id}-sys-resp`, groupId, systemId, Date.now(), resContent)

      this.messageRepository.add(funcMessage)
      this?.groupService?.broadcast(groupId, funcMessage as ServerToClientMessage)
    }
  }

  getMessages(groupId: string): Message[] {
    return this.messageRepository.get(groupId)
  }

  getLatestMessage(groupId: string): Message | null {
    return this.messageRepository.getLatest(groupId)
  }
}

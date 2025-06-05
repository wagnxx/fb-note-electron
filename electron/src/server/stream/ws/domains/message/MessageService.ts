// domains/message/MessageService.ts
import { MessageRepository } from './MessageRepository'
import { TextMessage, FileMessage, ImageMessage, Message } from './Message'
import { getNetworkInfo } from '@/utils/netUtils'
import { ServerToClientMessage } from '../../interfaces/types'

import { IGroupService } from '../../interfaces/services/IGroupService'
import { inject, provide, TYPES } from '../../core/ioc.config'
import { LazyServiceIdentifier } from 'inversify'
import { IMessageService } from '../../interfaces/services/IMessageService'
import { IUserService } from '../../interfaces/services/IUserService'

const FUNCTION_COMMANDS = {
  getWifiIp: '@getWifiIp',
  getUsers: '@getUsers',
}
@provide(TYPES.MessageService)
export class MessageService implements IMessageService {
  private readonly messageRepository: MessageRepository

  constructor(
    @inject(TYPES.UserService) private readonly userService: IUserService,
    @inject(new LazyServiceIdentifier(() => TYPES.GroupService)) private groupService: IGroupService,
  ) {
    this.messageRepository = new MessageRepository()
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

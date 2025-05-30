import { Message } from '../../domains/message/Message'

export interface IMessageService {
  addRawMessage(data: {
    id: string
    groupId: string
    sender: string
    content: string
    type: 'text' | 'file' | 'image'
    timestamp?: number
    fileName?: string
    fileType?: string
  }): Promise<void>

  getMessages(groupId: string): Message[]

  getLatestMessage(groupId: string): Message | null
}

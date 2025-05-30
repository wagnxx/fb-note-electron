// domains/message/MessageRepository.ts
import { inject, injectable, TYPES } from '../../core/ioc.config'
import { Message } from './Message'
@injectable()
export class MessageRepository {
  private messagesByGroup = new Map<string, Message[]>()

  add(message: Message): void {
    const list = this.messagesByGroup.get(message.groupId) ?? []
    list.push(message)
    list.sort((a, b) => a.timestamp - b.timestamp)
    this.messagesByGroup.set(message.groupId, list)
  }

  addMany(messages: Message[]): void {
    for (const msg of messages) {
      this.add(msg)
    }
  }

  get(groupId: string): Message[] {
    return this.messagesByGroup.get(groupId) ?? []
  }

  getLatest(groupId: string): Message | null {
    const msgs = this.get(groupId)
    return msgs.length > 0 ? msgs[msgs.length - 1] : null
  }
}

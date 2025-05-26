import { groupService } from '../manages/context'
import { ClientMeta } from '../types'

export function handleClientDisconnect(client: ClientMeta) {
  const group = groupService.getGroup(client.groupId)
  if (group) {
    // group.members = group.members.filter(c => c !== client)
    console.log(`👤 ${client.username} left group [${client.groupId}]`)
    groupService.broadcast(client.groupId, { type: 'system', message: `${client.username} left the chat.` })
  }
}

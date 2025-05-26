// services/GroupService.ts
import type { Group, ClientMeta, ServerToClientMessage } from '../types'
import { WebSocket } from 'ws'

const FUNCTION_COMMANDS = {
  getWifiIp: '@getWifiIp',
  getUsers: '@getUsers',
}
const systemClient: ClientMeta = { userId: 'system', username: 'System', groupId: '', socket: null }
const defaultGroup: Group = {
  id: 'sys',
  name: 'SystemGroup',
  members: [],
  admin: '',
  messages: [],
}
// groups.set(defaultGroup.id, defaultGroup)

export class GroupService {
  private groups = new Map<string, Group>()
  private groupInited = false

  private systemClient = systemClient

  constructor() {
    this.groups.set(defaultGroup.id, defaultGroup)
  }

  getOrCreateGroup(id: string): Group {
    if (!this.groups.has(id)) {
      this.groups.set(id, {
        id,
        name: '',
        members: [],
        admin: '',
        messages: [],
      })
    }
    return this.groups.get(id)!
  }

  initGroups(data: { groups: Group[] }) {
    if (this.groupInited) return
    this.groupInited = true
    const initialGroups = data.groups
    console.log('Initial groups:', initialGroups)
    initialGroups.forEach(group => this.groups.set(group.id, group))
  }

  addMember(groupId: string, client: ClientMeta) {
    const group = this.getOrCreateGroup(groupId)
    group.members.push(client)
    if (!group.admin) group.admin = client.username
  }
  resetUser(ws: WebSocket, data: any) {
    const id = data.id
    let updated = false
    this.groups.forEach(group => {
      const members = group.members
      const user = members.find(mem => mem.userId === id)
      if (user && user.socket !== ws) {
        user.socket = ws
        updated = true
      }
    })
    return updated
  }

  broadcast(groupId: string, message: ServerToClientMessage) {
    const group = this.getGroup(groupId)
    if (!group) return

    const payload = JSON.stringify(message)
    group.members.forEach(client => {
      if (client.socket?.readyState === WebSocket.OPEN) {
        client.socket.send(payload)
      }
    })
  }

  setGroup(id: string, group: Group) {
    this.groups.set(id, group)
  }

  getGroup(id: string) {
    return this.groups.get(id)
  }

  getAllGroups() {
    return this.groups
  }
  getSystemClient() {
    return this.systemClient
  }
}

// domains/user/User.ts
import { WebSocket } from 'ws'

export class User {
  id: string
  name?: string | null
  avatar?: string | null
  // socket?: WebSocket | null
  online: boolean

  constructor(params: { id: string; name?: string; socket?: WebSocket | null; avatar?: string }) {
    this.id = params.id
    this.online = true
    this.update(params)
  }

  update(data: Partial<Omit<User, 'id'>>) {
    if (data.name !== undefined) this.name = data.name
    if (data.avatar !== undefined) this.avatar = data.avatar
    // if (data.socket !== undefined) this.socket = data.socket
  }

  markOffline() {
    this.online = false
    // this.socket = null
  }

  // send(data: any) {
  //   if (this.socket && this.online) {
  //     this.socket.send(JSON.stringify(data))
  //   }
  // }
}

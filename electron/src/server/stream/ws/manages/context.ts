// manage/context.ts
import { WebSocketServer } from 'ws'

let wss: WebSocketServer | null = null

export function setWss(instance: WebSocketServer) {
  wss = instance
}

export function getWss() {
  return wss
}

import { GroupService } from '../services/group'
import { UserService } from '../services/user'

export const userService = new UserService()
export const groupService = new GroupService()

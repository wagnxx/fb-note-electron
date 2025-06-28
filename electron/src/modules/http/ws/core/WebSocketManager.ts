// server/stream/core/WebSocketManager.ts
import WebSocket from 'ws'
import { provide, TYPES } from './ioc.config'
import { ServerToClientMessage } from '../interfaces/types'

@provide(TYPES.WebSocketManager)
export class WebSocketManager {
  // 用户ID到连接的映射
  private userConnections = new Map<string, WebSocket>()
  // 群组ID到用户ID集合的映射
  private groupMembers = new Map<string, Set<string>>()

  /**
   * 添加连接到用户
   */
  addUserConnection(userId: string, ws: WebSocket): void {
    console.log(`[WebSocket] opend: ${userId}`)
    this.userConnections.set(userId, ws)
    this.setupConnectionCleanup(ws, userId)
  }

  isOnline(userId: string) {
    return this.userConnections.has(userId)
  }

  /**
   * 将用户加入群组
   */
  joinGroup(userId: string, groupId: string): void {
    if (!this.groupMembers.has(groupId)) {
      this.groupMembers.set(groupId, new Set())
    }
    this.groupMembers.get(groupId)!.add(userId)
  }

  /**
   * 向群组广播消息
   */
  broadcastToGroup(groupId: string, message: ServerToClientMessage): number {
    const userIds = this.groupMembers.get(groupId)
    if (!userIds) return 0

    let successCount = 0
    userIds.forEach(userId => {
      const ws = this.userConnections.get(userId)
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message), err => {
          if (!err) successCount++
        })
      }
    })
    return successCount
  }

  sendToUsers(userIds: string[], message: ServerToClientMessage): number {
    if (!userIds.length) return 0

    let successCount = 0
    userIds.forEach(userId => {
      const ws = this.userConnections.get(userId)
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message), err => {
          if (!err) successCount++
        })
      }
    })
    return successCount
  }
  // ✅ 新增：单发给某个用户
  sendToUser(params: { userId?: string; ws?: WebSocket }, message: ServerToClientMessage): boolean {
    const ws = params.ws ?? (params.userId ? this.userConnections.get(params.userId) : undefined)
    if (!ws || ws.readyState !== WebSocket.OPEN) return false

    try {
      ws.send(JSON.stringify(message))
      return true
    } catch (err) {
      console.warn(`Failed to send message:`, err)
      return false
    }
  }

  private setupConnectionCleanup(ws: WebSocket, userId: string): void {
    ws.on('close', () => {
      this.userConnections.delete(userId)
      // 从所有群组中移除该用户
      this.groupMembers.forEach(members => members.delete(userId))
    })
  }
}

import { getWSClient } from './baseWSClient'

export class WSClient {
  socket: WebSocket
  userId: string
  pendingRequests = new Map<string, (res: any) => void>()
  pushHandlers: ((msg: any) => void)[] = []

  private openListeners: (() => void)[] = []
  private closeListeners: (() => void)[] = []
  private errorListeners: ((err: Event) => void)[] = []

  constructor(socket: WebSocket, userId: string) {
    this.socket = socket
    this.userId = userId
    this.socket.onmessage = this.handleMessage.bind(this)

    this.socket.onopen = () => this.openListeners.forEach(fn => fn())
    this.socket.onclose = () => this.closeListeners.forEach(fn => fn())
    this.socket.onerror = err => this.errorListeners.forEach(fn => fn(err))
  }

  private handleMessage(event: MessageEvent) {
    const msg = JSON.parse(event.data)
    if (msg.requestId && this.pendingRequests.has(msg.requestId)) {
      this.pendingRequests.get(msg.requestId)?.(msg.payload)
      this.pendingRequests.delete(msg.requestId)
    } else {
      // 处理服务端推送消息，例如通知、群聊广播等
      // console.log('推送消息:', msg)
      this.pushHandlers.forEach(handler => handler(msg))
    }
  }

  request<T = any, R = any>(type: string, payload: T): Promise<R> {
    const requestId = this.generateRequestId()
    const message = { type, payload, requestId }
    return new Promise<R>(resolve => {
      this.pendingRequests.set(requestId, resolve)
      this.socket.send(JSON.stringify(message))
    })
  }

  send<T = any>(type: string, payload: T): void {
    const message = { type, payload }
    this.socket.send(JSON.stringify(message))
  }

  onPush(handler: (msg: any) => void) {
    this.pushHandlers.push(handler)
  }

  private generateRequestId(): string {
    return Math.random().toString(36).slice(2) + Date.now()
  }

  // 连接状态监听
  onOpen(fn: () => void) {
    this.openListeners.push(fn)
  }

  onClose(fn: () => void) {
    this.closeListeners.push(fn)
  }

  onError(fn: (err: Event) => void) {
    this.errorListeners.push(fn)
  }

  close(force = false) {
    if (!this.socket) return

    const state = this.socket.readyState
    if (state === WebSocket.OPEN || (force && (state === WebSocket.CONNECTING || state === WebSocket.CLOSING))) {
      this.socket.close()
    }
  }
}

// 工厂函数，构建带 userId 的 WSClient 实例

let instance: WSClient | null = null

export async function getWSClientInstance(lanIp?: string): Promise<WSClient | null> {
  if (instance) return instance

  if (!lanIp) return null // 无法创建，只能获取

  const raw = await getWSClient(lanIp)
  if (!raw) return null

  instance = new WSClient(raw.socket, raw.id)

  return instance
}

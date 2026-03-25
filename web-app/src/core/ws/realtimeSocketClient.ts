import { AcquireSocketOptions, SocketIdentity } from './socketConnectionFactory'

type PendingRequest = {
  resolve: (res: any) => void
  reject: (err: Error) => void
  timer: ReturnType<typeof setTimeout>
}

type RequestOptions = {
  timeoutMs?: number
}

type ReconnectPolicy = {
  enabled: boolean
  maxRetries: number
  initialDelayMs: number
  maxDelayMs: number
  factor: number
  jitter: number
}

type HeartbeatPolicy = {
  enabled: boolean
  intervalMs: number
  timeoutMs: number
}

type SocketAcquire = (options?: AcquireSocketOptions) => Promise<SocketIdentity | null>

type RealtimeSocketClientOptions = {
  initialIdentity: SocketIdentity
  endpointKey: string
  acquireSocket: SocketAcquire
  requestTimeoutMs?: number
  reconnectPolicy?: Partial<ReconnectPolicy>
  heartbeatPolicy?: Partial<HeartbeatPolicy>
}

const DEFAULT_REQUEST_TIMEOUT_MS = 10_000
const DEFAULT_HEARTBEAT_INTERVAL_MS = 15_000
const DEFAULT_HEARTBEAT_TIMEOUT_MS = 45_000
const DEFAULT_WAIT_OPEN_TIMEOUT_MS = 8_000

export class RealtimeSocketClient {
  socket: WebSocket
  userId: string

  private endpointKey: string
  private acquireSocket: SocketAcquire
  private manuallyClosed = false
  private reconnectAttempts = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private lastPongAt = Date.now()
  private requestTimeoutMs: number

  private reconnectPolicy: ReconnectPolicy = {
    enabled: true,
    maxRetries: 8,
    initialDelayMs: 500,
    maxDelayMs: 10_000,
    factor: 2,
    jitter: 0.2,
  }

  private heartbeatPolicy: HeartbeatPolicy = {
    enabled: true,
    intervalMs: DEFAULT_HEARTBEAT_INTERVAL_MS,
    timeoutMs: DEFAULT_HEARTBEAT_TIMEOUT_MS,
  }

  pendingRequests = new Map<string, PendingRequest>()
  pushHandlers = new Set<(msg: any) => void>()

  private openListeners = new Set<() => void>()
  private closeListeners = new Set<() => void>()
  private errorListeners = new Set<(err: Event) => void>()

  constructor(options: RealtimeSocketClientOptions) {
    this.socket = options.initialIdentity.socket
    this.userId = options.initialIdentity.id
    this.endpointKey = options.endpointKey
    this.acquireSocket = options.acquireSocket
    this.requestTimeoutMs = options.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS

    if (options.reconnectPolicy) {
      this.reconnectPolicy = { ...this.reconnectPolicy, ...options.reconnectPolicy }
    }
    if (options.heartbeatPolicy) {
      this.heartbeatPolicy = { ...this.heartbeatPolicy, ...options.heartbeatPolicy }
    }

    this.bindSocket(options.initialIdentity.socket)
  }

  isForEndpoint(endpointKey: string) {
    return this.endpointKey === endpointKey
  }

  private bindSocket(socket: WebSocket) {
    this.socket = socket
    this.manuallyClosed = false
    this.socket.onmessage = this.handleMessage.bind(this)
    this.socket.onopen = () => {
      this.reconnectAttempts = 0
      this.lastPongAt = Date.now()
      this.startHeartbeat()
      this.openListeners.forEach(fn => fn())
    }
    this.socket.onclose = () => {
      this.stopHeartbeat()
      this.clearPendingRequests('WebSocket connection lost')
      this.closeListeners.forEach(fn => fn())
      this.tryReconnect()
    }
    this.socket.onerror = err => this.errorListeners.forEach(fn => fn(err))
  }

  private startHeartbeat() {
    this.stopHeartbeat()
    if (!this.heartbeatPolicy.enabled) return

    this.heartbeatTimer = setInterval(() => {
      if (this.socket.readyState !== WebSocket.OPEN) return

      if (Date.now() - this.lastPongAt > this.heartbeatPolicy.timeoutMs) {
        console.warn('WebSocket heartbeat timeout, closing socket to trigger reconnect')
        this.socket.close()
        return
      }

      this.publish('ping', {
        timestamp: Date.now(),
      })
    }, this.heartbeatPolicy.intervalMs)
  }

  private stopHeartbeat() {
    if (!this.heartbeatTimer) return
    clearInterval(this.heartbeatTimer)
    this.heartbeatTimer = null
  }

  private clearReconnectTimer() {
    if (!this.reconnectTimer) return
    clearTimeout(this.reconnectTimer)
    this.reconnectTimer = null
  }

  private nextReconnectDelay() {
    const { initialDelayMs, factor, maxDelayMs, jitter } = this.reconnectPolicy
    const baseDelay = Math.min(initialDelayMs * Math.pow(factor, this.reconnectAttempts), maxDelayMs)
    const randomRatio = 1 + (Math.random() * 2 - 1) * jitter
    return Math.max(100, Math.floor(baseDelay * randomRatio))
  }

  private async reconnectNow(): Promise<boolean> {
    try {
      const raw = await this.acquireSocket({ forceNew: true })
      if (!raw) return false
      this.bindSocket(raw.socket)
      return true
    } catch (error) {
      console.error('WebSocket reconnect failed:', error)
      this.tryReconnect()
      return false
    }
  }

  private tryReconnect() {
    if (this.manuallyClosed || !this.reconnectPolicy.enabled) return
    if (this.reconnectAttempts >= this.reconnectPolicy.maxRetries) return

    this.clearReconnectTimer()
    const delay = this.nextReconnectDelay()
    this.reconnectAttempts += 1
    this.reconnectTimer = setTimeout(() => {
      void this.reconnectNow()
    }, delay)
  }

  private handleMessage(event: MessageEvent) {
    try {
      const msg = JSON.parse(event.data)
      if (msg.type === 'pong') {
        this.lastPongAt = Date.now()
        return
      }

      if (msg.requestId && this.pendingRequests.has(msg.requestId)) {
        const pending = this.pendingRequests.get(msg.requestId)
        if (pending) {
          clearTimeout(pending.timer)
          pending.resolve(msg.payload)
          this.pendingRequests.delete(msg.requestId)
        }
      }

      this.pushHandlers.forEach(handler => handler(msg))
    } catch (error) {
      console.error('Invalid WebSocket message:', error)
    }
  }

  private waitForOpen(timeoutMs = DEFAULT_WAIT_OPEN_TIMEOUT_MS): Promise<boolean> {
    if (this.socket.readyState === WebSocket.OPEN) {
      return Promise.resolve(true)
    }

    return new Promise(resolve => {
      const timer = setTimeout(() => {
        offOpen()
        offError()
        resolve(this.socket.readyState === WebSocket.OPEN)
      }, timeoutMs)

      const finalize = (ok: boolean) => {
        clearTimeout(timer)
        offOpen()
        offError()
        resolve(ok)
      }

      const offOpen = this.onOpen(() => finalize(true))
      const offError = this.onError(() => finalize(false))
    })
  }

  async ensureConnected(timeoutMs = DEFAULT_WAIT_OPEN_TIMEOUT_MS): Promise<boolean> {
    if (this.socket.readyState === WebSocket.OPEN) {
      return true
    }

    if (this.socket.readyState === WebSocket.CLOSED) {
      const triggered = await this.reconnect()
      if (!triggered) {
        return false
      }
    }

    if (this.socket.readyState === WebSocket.CLOSING) {
      return false
    }

    return this.waitForOpen(timeoutMs)
  }

  async request<T = any, R = any>(type: string, payload: T, options?: RequestOptions): Promise<R> {
    const isConnected = await this.ensureConnected()
    if (!isConnected || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected')
    }

    const requestId = this.generateRequestId()
    const message = { type, payload, requestId }
    const timeoutMs = options?.timeoutMs ?? this.requestTimeoutMs

    return new Promise<R>((resolve, reject) => {
      const timer = setTimeout(() => {
        const pending = this.pendingRequests.get(requestId)
        if (!pending) return
        pending.reject(new Error(`WebSocket request timeout: ${type}`))
        this.pendingRequests.delete(requestId)
      }, timeoutMs)

      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        timer,
      })

      this.socket.send(JSON.stringify(message))
    })
  }

  publish<T = any>(type: string, payload: T): void {
    if (this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected')
    }

    const message = { type, payload }
    this.socket.send(JSON.stringify(message))
  }

  send<T = any>(type: string, payload: T): void {
    this.publish(type, payload)
  }

  onPush(handler: (msg: any) => void) {
    this.pushHandlers.add(handler)
    return () => {
      this.pushHandlers.delete(handler)
    }
  }

  onOpen(fn: () => void) {
    this.openListeners.add(fn)
    return () => {
      this.openListeners.delete(fn)
    }
  }

  onClose(fn: () => void) {
    this.closeListeners.add(fn)
    return () => {
      this.closeListeners.delete(fn)
    }
  }

  onError(fn: (err: Event) => void) {
    this.errorListeners.add(fn)
    return () => {
      this.errorListeners.delete(fn)
    }
  }

  private generateRequestId(): string {
    return Math.random().toString(36).slice(2) + Date.now()
  }

  private clearPendingRequests(reason: string) {
    this.pendingRequests.forEach(pending => {
      clearTimeout(pending.timer)
      pending.reject(new Error(reason))
    })
    this.pendingRequests.clear()
  }

  disconnect(force = false) {
    if (!this.socket) return

    this.manuallyClosed = true
    this.clearReconnectTimer()
    this.stopHeartbeat()
    this.clearPendingRequests('WebSocket connection closed')

    const state = this.socket.readyState
    if (state === WebSocket.OPEN || (force && (state === WebSocket.CONNECTING || state === WebSocket.CLOSING))) {
      this.socket.close()
    }
  }

  close(force = false) {
    this.disconnect(force)
  }

  async reconnect(): Promise<boolean> {
    this.manuallyClosed = false
    this.clearReconnectTimer()
    return this.reconnectNow()
  }
}

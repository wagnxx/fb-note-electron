import { BaseClientGetOptions, RawWSClient } from './baseClient'

type PendingRequest = {
  resolve: (res: any) => void
  reject: (err: Error) => void
  timer: ReturnType<typeof setTimeout>
}

type RequestOptions = {
  timeoutMs?: number
}

type ReconnectOptions = {
  enabled: boolean
  maxRetries: number
  initialDelayMs: number
  maxDelayMs: number
  factor: number
  jitter: number
}

type HeartbeatOptions = {
  enabled: boolean
  intervalMs: number
  timeoutMs: number
}

type SocketFactory = (options?: BaseClientGetOptions) => Promise<RawWSClient | null>

type CoreWSClientOptions = {
  initialClient: RawWSClient
  endpointKey: string
  socketFactory: SocketFactory
  requestTimeoutMs?: number
  reconnectOptions?: Partial<ReconnectOptions>
  heartbeatOptions?: Partial<HeartbeatOptions>
}

const DEFAULT_REQUEST_TIMEOUT_MS = 10_000
const DEFAULT_HEARTBEAT_INTERVAL_MS = 15_000
const DEFAULT_HEARTBEAT_TIMEOUT_MS = 45_000

export class CoreWSClient {
  socket: WebSocket
  userId: string

  private endpointKey: string
  private socketFactory: SocketFactory
  private manualClosed = false
  private reconnectAttempts = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private lastPongAt = Date.now()
  private requestTimeoutMs: number

  private reconnectOptions: ReconnectOptions = {
    enabled: true,
    maxRetries: 8,
    initialDelayMs: 500,
    maxDelayMs: 10_000,
    factor: 2,
    jitter: 0.2,
  }

  private heartbeatOptions: HeartbeatOptions = {
    enabled: true,
    intervalMs: DEFAULT_HEARTBEAT_INTERVAL_MS,
    timeoutMs: DEFAULT_HEARTBEAT_TIMEOUT_MS,
  }

  pendingRequests = new Map<string, PendingRequest>()
  pushHandlers = new Set<(msg: any) => void>()

  private openListeners = new Set<() => void>()
  private closeListeners = new Set<() => void>()
  private errorListeners = new Set<(err: Event) => void>()

  constructor(options: CoreWSClientOptions) {
    this.socket = options.initialClient.socket
    this.userId = options.initialClient.id
    this.endpointKey = options.endpointKey
    this.socketFactory = options.socketFactory
    this.requestTimeoutMs = options.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS

    if (options.reconnectOptions) {
      this.reconnectOptions = { ...this.reconnectOptions, ...options.reconnectOptions }
    }
    if (options.heartbeatOptions) {
      this.heartbeatOptions = { ...this.heartbeatOptions, ...options.heartbeatOptions }
    }

    this.bindSocket(options.initialClient.socket)
  }

  isForEndpoint(endpointKey: string) {
    return this.endpointKey === endpointKey
  }

  private bindSocket(socket: WebSocket) {
    this.socket = socket
    this.manualClosed = false
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
    if (!this.heartbeatOptions.enabled) return

    this.heartbeatTimer = setInterval(() => {
      if (this.socket.readyState !== WebSocket.OPEN) return

      if (Date.now() - this.lastPongAt > this.heartbeatOptions.timeoutMs) {
        console.warn('WebSocket heartbeat timeout, closing socket to trigger reconnect')
        this.socket.close()
        return
      }

      this.socket.send(
        JSON.stringify({
          type: 'ping',
          payload: {
            timestamp: Date.now(),
          },
        }),
      )
    }, this.heartbeatOptions.intervalMs)
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
    const { initialDelayMs, factor, maxDelayMs, jitter } = this.reconnectOptions
    const baseDelay = Math.min(initialDelayMs * Math.pow(factor, this.reconnectAttempts), maxDelayMs)
    const randomRatio = 1 + (Math.random() * 2 - 1) * jitter
    return Math.max(100, Math.floor(baseDelay * randomRatio))
  }

  private async reconnectNow() {
    try {
      const raw = await this.socketFactory({ forceNew: true })
      if (!raw) return
      this.bindSocket(raw.socket)
    } catch (error) {
      console.error('WebSocket reconnect failed:', error)
      this.tryReconnect()
    }
  }

  private tryReconnect() {
    if (this.manualClosed || !this.reconnectOptions.enabled) return
    if (this.reconnectAttempts >= this.reconnectOptions.maxRetries) return

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
      } else {
        this.pushHandlers.forEach(handler => handler(msg))
      }
    } catch (error) {
      console.error('Invalid WebSocket message:', error)
    }
  }

  request<T = any, R = any>(type: string, payload: T, options?: RequestOptions): Promise<R> {
    if (this.socket.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error('WebSocket is not connected'))
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

  send<T = any>(type: string, payload: T): void {
    if (this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected')
    }

    const message = { type, payload }
    this.socket.send(JSON.stringify(message))
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

  close(force = false) {
    if (!this.socket) return

    this.manualClosed = true
    this.clearReconnectTimer()
    this.stopHeartbeat()
    this.clearPendingRequests('WebSocket connection closed')

    const state = this.socket.readyState
    if (state === WebSocket.OPEN || (force && (state === WebSocket.CONNECTING || state === WebSocket.CLOSING))) {
      this.socket.close()
    }
  }
}

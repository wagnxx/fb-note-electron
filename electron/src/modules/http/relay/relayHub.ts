// 临时方案备注：当前 relayHub 及相关能力为过渡实现。
// 后续并入统一架构时，请评估并按需还原/收敛以下文件：
// - electron/src/modules/http/express/routes/hub.ts
// - electron/src/modules/http/ws/index.ts
// - electron/src/modules/http/ws/manages/ctx.ts
// - electron/src/modules/http/ws/server.ts
// - electron/src/modules/http/relay/sessionManager.ts
// - electron/src/modules/http/relay/relayHub.ts
// - web-app/src/pages/tools/relay/index.tsx
// - web-app/src/pages/tools/relay/web.tsx
// - web-app/src/routes/config/tool.ts
// - web-app/src/routes/routes.ts
import WebSocket from 'ws'

type RelayPeer = {
  userId: string
  deviceId: string
  deviceName: string
  connectedAt: number
  lastSeenAt: number
  ws: WebSocket
}

type RelayTextPayload = {
  id: string
  sender: string
  deviceName: string
  timestamp: number
  content: string
}

type RelayFilePayload = {
  id: string
  sender: string
  deviceName: string
  timestamp: number
  fileName: string
  fileType: string
  content: string
  size?: number
}

type RelaySystemPayload = {
  id: string
  timestamp: number
  content: string
}

type RelayMessage =
  | { type: 'text'; payload: RelayTextPayload }
  | { type: 'file'; payload: RelayFilePayload }
  | { type: 'system'; payload: RelaySystemPayload }

const MAX_HISTORY = 300

class RelayHub {
  private readonly peers = new Map<string, RelayPeer>()
  private readonly history: RelayMessage[] = []

  addConnection(params: { userId: string; deviceId: string; deviceName: string; ws: WebSocket }) {
    const now = Date.now()
    const existed = this.peers.get(params.userId)
    if (existed && existed.ws !== params.ws) {
      try {
        existed.ws.close()
      } catch {
        // ignore
      }
    }

    this.peers.set(params.userId, {
      userId: params.userId,
      deviceId: params.deviceId,
      deviceName: params.deviceName,
      connectedAt: existed?.connectedAt || now,
      lastSeenAt: now,
      ws: params.ws,
    })

    this.sendToPeer(params.userId, {
      type: 'welcome',
      payload: {
        selfId: params.userId,
        serverTime: now,
      },
    })

    this.sendToPeer(params.userId, {
      type: 'history',
      payload: {
        messages: this.history,
      },
    })

    this.pushSystem(`${params.deviceName} connected`)
    this.broadcastPeers()
  }

  removeConnection(userId: string) {
    const peer = this.peers.get(userId)
    if (!peer) return

    this.peers.delete(userId)
    this.pushSystem(`${peer.deviceName} disconnected`)
    this.broadcastPeers()
  }

  handleRawMessage(userId: string, raw: string) {
    const peer = this.peers.get(userId)
    if (!peer) return

    peer.lastSeenAt = Date.now()
    this.peers.set(userId, peer)

    let parsed: any
    try {
      parsed = JSON.parse(raw)
    } catch {
      this.sendToPeer(userId, {
        type: 'error',
        payload: { message: 'invalid json payload' },
      })
      return
    }

    const type = String(parsed?.type || '')
    if (type === 'ping') {
      this.sendToPeer(userId, { type: 'pong', payload: { timestamp: Date.now() } })
      return
    }

    if (type === 'text') {
      const content = String(parsed?.payload?.content || '').trim()
      if (!content) return

      const message: RelayMessage = {
        type: 'text',
        payload: {
          id: String(parsed?.payload?.id || this.genId('text')),
          sender: userId,
          deviceName: peer.deviceName,
          timestamp: Date.now(),
          content,
        },
      }
      this.appendHistory(message)
      this.broadcast({ type: 'text', payload: message.payload })
      return
    }

    if (type === 'file') {
      const fileName = String(parsed?.payload?.fileName || '')
      const fileType = String(parsed?.payload?.fileType || 'application/octet-stream')
      const content = String(parsed?.payload?.content || '')
      const size = Number(parsed?.payload?.size || 0)
      if (!fileName || !content) return

      const message: RelayMessage = {
        type: 'file',
        payload: {
          id: String(parsed?.payload?.id || this.genId('file')),
          sender: userId,
          deviceName: peer.deviceName,
          timestamp: Date.now(),
          fileName,
          fileType,
          content,
          size,
        },
      }
      this.appendHistory(message)
      this.broadcast({ type: 'file', payload: message.payload })
      return
    }
  }

  kickUser(userId: string, reason = 'kicked by host') {
    const peer = this.peers.get(userId)
    if (!peer) return false

    this.sendToPeer(userId, {
      type: 'kicked',
      payload: {
        reason,
        timestamp: Date.now(),
      },
    })
    try {
      peer.ws.close()
    } catch {
      // ignore
    }
    return true
  }

  getOnlineCount() {
    return this.peers.size
  }

  getOnlineUserIds() {
    return Array.from(this.peers.keys())
  }

  getPeers() {
    return Array.from(this.peers.values()).map(peer => ({
      userId: peer.userId,
      deviceId: peer.deviceId,
      deviceName: peer.deviceName,
      connectedAt: peer.connectedAt,
      lastSeenAt: peer.lastSeenAt,
    }))
  }

  private genId(prefix: string) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  }

  private appendHistory(message: RelayMessage) {
    this.history.push(message)
    if (this.history.length > MAX_HISTORY) {
      this.history.shift()
    }
  }

  private pushSystem(content: string) {
    const message: RelayMessage = {
      type: 'system',
      payload: {
        id: this.genId('system'),
        timestamp: Date.now(),
        content,
      },
    }
    this.appendHistory(message)
    this.broadcast({ type: 'system', payload: message.payload })
  }

  private sendToPeer(userId: string, message: any) {
    const peer = this.peers.get(userId)
    if (!peer) return
    if (peer.ws.readyState !== WebSocket.OPEN) return
    peer.ws.send(JSON.stringify(message))
  }

  private broadcast(message: any) {
    const payload = JSON.stringify(message)
    for (const peer of this.peers.values()) {
      if (peer.ws.readyState === WebSocket.OPEN) {
        peer.ws.send(payload)
      }
    }
  }

  private broadcastPeers() {
    this.broadcast({
      type: 'peers',
      payload: {
        devices: this.getPeers(),
      },
    })
  }
}

export const relayHub = new RelayHub()

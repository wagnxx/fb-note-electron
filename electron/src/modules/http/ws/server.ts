import { WebSocketServer, WebSocket } from 'ws'
import { parse } from 'url'
import { Server as HTTPServer, IncomingMessage } from 'http'
import { dispatcher, wsManager } from './manages/ctx'
import { relaySessionManager } from '../relay/sessionManager'
import { relayHub } from '../relay/relayHub'

// 初始化控制器
export function bindServer(httpServer: HTTPServer) {
  const chatWss = new WebSocketServer({ noServer: true })
  const relayWss = new WebSocketServer({ noServer: true })

  httpServer.on('upgrade', (req, socket, head) => {
    const { pathname } = parse(req.url || '')
    if (pathname === '/chat') {
      chatWss.handleUpgrade(req, socket, head, ws => {
        chatWss.emit('connection', ws, req)
      })
    } else if (pathname === '/relay') {
      relayWss.handleUpgrade(req, socket, head, ws => {
        relayWss.emit('connection', ws, req)
      })
    } else {
      socket.destroy()
    }
  })

  chatWss.on('connection', handleConnection)
  relayWss.on('connection', handleRelayConnection)
}

export function handleConnection(ws: WebSocket, req: IncomingMessage) {
  // 1. 从 URL 获取 token 或 userId，例如：ws://localhost:4000/chat?token=xxx
  const url = new URL(req.url || '', `http://${req.headers.host}`)
  const token = url.searchParams.get('token')
  const legacyUserId = url.searchParams.get('userId')

  const tokenSession = relaySessionManager.validateToken(token)
  const userId = tokenSession?.userId || legacyUserId

  if (!userId) {
    ws.send(JSON.stringify({ type: 'error', reason: 'token or userId required in query' }))
    ws.close()
    return
  }

  if (tokenSession) {
    relaySessionManager.touchDevice(tokenSession.deviceId)
  }

  // 2. 注册用户连接
  wsManager.addUserConnection(userId, ws)

  // 3. 监听消息并交给 dispatcher
  ws.on('message', raw => {
    try {
      const data = JSON.parse(raw.toString())
      dispatcher.dispatch(ws, data)
    } catch (err) {
      console.error('Invalid message:', err)
    }
  })

  // ✅ 这个是可选的，仅用于打印
  ws.on('close', () => {
    console.log(`[WebSocket] closed: ${userId}`)
    // 不需要额外 wsManager 清理逻辑，这里只是打印
  })
}

export function handleRelayConnection(ws: WebSocket, req: IncomingMessage) {
  const url = new URL(req.url || '', `http://${req.headers.host}`)
  const token = url.searchParams.get('token')
  const fallbackUserId = url.searchParams.get('userId') || 'desktop-host'
  const fallbackDeviceId = url.searchParams.get('deviceId') || fallbackUserId
  const fallbackDeviceName = url.searchParams.get('deviceName') || 'Desktop Host'

  const tokenSession = relaySessionManager.validateToken(token)

  const userId = tokenSession?.userId || fallbackUserId
  const deviceId = tokenSession?.deviceId || fallbackDeviceId
  const pairedDevice = relaySessionManager.getDevice(deviceId)
  const deviceName = pairedDevice?.deviceName || fallbackDeviceName

  relayHub.addConnection({
    userId,
    deviceId,
    deviceName,
    ws,
  })

  ws.on('message', raw => {
    relayHub.handleRawMessage(userId, raw.toString())
  })

  ws.on('close', () => {
    relayHub.removeConnection(userId)
  })
}

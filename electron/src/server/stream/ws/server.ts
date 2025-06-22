import { WebSocketServer, WebSocket } from 'ws'
import { parse } from 'url'
import { Server as HTTPServer, IncomingMessage } from 'http'
import { dispatcher, wsManager } from './manages/ctx'

// 初始化控制器
export function bindServer(httpServer: HTTPServer) {
  const wss = new WebSocketServer({ noServer: true })

  httpServer.on('upgrade', (req, socket, head) => {
    const { pathname } = parse(req.url || '')
    if (pathname === '/chat') {
      wss.handleUpgrade(req, socket, head, ws => {
        wss.emit('connection', ws, req)
      })
    } else {
      socket.destroy()
    }
  })

  wss.on('connection', handleConnection)
}

export function handleConnection(ws: WebSocket, req: IncomingMessage) {
  // 1. 从 URL 获取 userId，例如：ws://localhost:4000/chat?userId=abc123
  const url = new URL(req.url || '', `http://${req.headers.host}`)
  const userId = url.searchParams.get('userId')

  if (!userId) {
    ws.send(JSON.stringify({ type: 'error', reason: 'userId required in query' }))
    ws.close()
    return
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

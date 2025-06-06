import { WebSocketServer, WebSocket } from 'ws'
import { parse } from 'url'
import { Server as HTTPServer, IncomingMessage } from 'http'
import { dispatcher } from './manages/ctx'

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

// eslint-disable-next-line unused-imports/no-unused-vars
export function handleConnection(ws: WebSocket, req: IncomingMessage) {
  ws.on('message', raw => {
    try {
      const data = JSON.parse(raw.toString())
      dispatcher.dispatch(ws, data)
    } catch (err) {
      console.error('Invalid message:', err)
    }
  })

  ws.on('close', () => {
    // handleClientDisconnect(ws)
  })
}

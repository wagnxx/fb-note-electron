import { WebSocketServer, WebSocket } from 'ws'
import { parse } from 'url'
import { Server as HTTPServer, IncomingMessage } from 'http'
import { handleClientDisconnect } from './services/disconnect'
import { routeMessage } from './messageRouter'

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
  let client = null

  ws.on('message', raw => {
    try {
      const data = JSON.parse(raw.toString())
      routeMessage(ws, data, client)
    } catch (err) {
      console.error('Invalid message:', err)
    }
  })

  ws.on('close', () => {
    if (client) handleClientDisconnect(client)
  })
}

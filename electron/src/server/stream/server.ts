// server.ts
import type { Server } from 'http'
let currentServer: Server | null = null
const PORT = 4000

async function restart(): Promise<Server> {
  if (currentServer) {
    console.log('🛑 Closing previous video stream server...')
    await new Promise<void>((resolve, reject) => {
      currentServer!.close(err => {
        if (err) {
          console.error('❌ Failed to close server:', err)
          reject(err)
        } else {
          console.log('✅ Previous server closed.')
          resolve()
        }
      })
    })
    currentServer = null
  }

  try {
    const mod = await import(`./expressApp`)
    const app = mod.createApp()

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`)
    })

    // 👇 绑定 WebSocket 服务
    const { bindWSServer } = await import('./ws')
    bindWSServer(server)

    currentServer = server
    return server
  } catch (err) {
    console.error('❌ Failed to start new server:', err)
    throw err
  }
}

export default {
  restart,
}

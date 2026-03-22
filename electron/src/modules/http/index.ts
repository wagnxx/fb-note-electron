// modules/http/HttpModule.ts
import type { Server } from 'http'
import type { Application } from 'express'
import { BaseModule } from '@/core/di'
import prisma from '@/prisma/prismaClient'

export class HttpModule extends BaseModule {
  static moduleName = 'http'
  private server: Server | null = null
  private app: Application | null = null

  async start(): Promise<void> {
    if (this.server) {
      console.warn('[HttpModule] Server already started.')
      return
    }

    await prisma.$connect()

    const { createApp } = await import('./express/expressApp')
    const app = createApp()
    const server = app.listen(4000, () => {
      console.log('🚀 Server running at http://localhost:4000')

      // 启动中继发现服务
      const { relayDiscovery } = require('./relay/discoveryService')
      const { wsPublicApi } = require('./ws')
      relayDiscovery.publish(4000, wsPublicApi)
    })

    const { bindWSServer } = await import('./ws')
    bindWSServer(server)

    this.app = app
    this.server = server
  }

  async stop(): Promise<void> {
    if (!this.server) return

    // 停止中继发现服务
    const { relayDiscovery } = require('./relay/discoveryService')
    relayDiscovery.unpublish()

    console.log('🛑 Closing HTTP server...')
    await new Promise<void>((resolve, reject) => {
      this.server!.close(err => {
        if (err) {
          console.error('❌ Failed to close HTTP server:', err)
          reject(err)
        } else {
          console.log('✅ HTTP server closed.')
          resolve()
        }
      })
    })

    this.server = null
    this.app = null
  }
}

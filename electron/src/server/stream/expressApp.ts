import express, { Request, Response } from 'express'
import path from 'path'
import history from 'connect-history-api-fallback'
import { getDistPath, getSupportPath } from '@/config'
import video from './routes/video'
import image from './routes/image'
import wifiIP from './routes/wifiIP'
import cors from './middlewares/cors'
import { createPortalRedirectMiddleware } from './middlewares/portalRedirect'
import gzipStatic from './middlewares/gzipStatic'
import { forbidLogsAccess } from './middlewares/permissions'

const staticPath = path.join(getDistPath(), '../..', 'web-app/build')
const assetsPath = getSupportPath('assets')

export const createApp = () => {
  const server = express()

  server.use(cors())

  // 请求路径重定向
  server.use(createPortalRedirectMiddleware({ portals: ['/ulogi'] }))

  server.use(
    '/ulogi',
    // history fallback，处理 SPA
    history({ index: '/index.html' }),
    // 处理 gzip
    gzipStatic,
    // 静态资源目录
    express.static(staticPath),
  )

  // 静态资源目录
  server.use('/assets', express.static(assetsPath))

  // 禁止访问 /logs
  server.use('/logs', forbidLogsAccess)

  // 路由挂载
  server.use('/video', video)
  server.use('/image', image)
  server.use('/wifiIP', wifiIP)

  server.get('/test', (req: Request, res: Response) => {
    res.send('raa -')
  })

  return server
}

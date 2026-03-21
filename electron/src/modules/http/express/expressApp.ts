import express from 'express'
import path from 'path'
import history from 'connect-history-api-fallback'
import morgan from 'morgan'
import { getDistPath, getSupportPath } from '@/config'
import cors from './middlewares/cors'
import { createPortalRedirectMiddleware } from './middlewares/portalRedirect'
import gzipStatic from './middlewares/gzipStatic'
import { forbidLogsAccess } from './middlewares/permissions'
import routes from './routes'

const staticPath = path.join(getDistPath(), '../..', 'web-app/build')
const assetsPath = getSupportPath('assets')

export const createApp = () => {
  const app = express()
  app.use(morgan('dev'))
  app.use(cors())
  app.use(express.json({ limit: '3mb' }))
  app.use(express.urlencoded({ extended: true }))

  // 请求路径重定向
  app.use(createPortalRedirectMiddleware({ portals: ['/ulogi'] }))

  app.use(
    '/ulogi',
    // history fallback，处理 SPA
    history({ index: '/index.html' }),
    // 处理 gzip
    gzipStatic,
    // 静态资源目录
    express.static(staticPath),
  )

  // 静态资源目录
  app.use('/assets', express.static(assetsPath))

  // 禁止访问 /logs
  app.use('/logs', forbidLogsAccess)

  // 路由挂载 全部统一挂载到根
  app.use('/', routes)

  app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[ULOGI ERROR]', err)
    res.status(500).json({ message: 'Internal Server Error' })
  })

  return app
}

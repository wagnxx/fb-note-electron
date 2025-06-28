import { NextFunction, Request, Response } from 'express'

interface RedirectOptions {
  portals: string[]
  match?: (path: string, portal: string) => boolean
  logPrefix?: string
}

/**
 * 创建一个中间件，当请求路径匹配某些 portal 根路径时，重写 URL 并跳转至 index.html
 */
export const createPortalRedirectMiddleware = ({
  portals,
  match = (path, portal) => path === portal, // 默认严格匹配
  logPrefix = '[PortalRedirect]',
}: RedirectOptions) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const portal = portals.find(p => match(req.path, p))
    if (portal) {
      console.log(`${logPrefix} Root matched: ${portal} → ${portal}/`)
      req.url = portal + '/'
    }
    next()
  }
}

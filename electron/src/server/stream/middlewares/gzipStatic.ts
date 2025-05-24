import { Request, Response, NextFunction } from 'express'
import fs from 'fs'
import path from 'path'
import { getDistPath } from '@/config'
import { getMimeType } from '@/utils/parseUtils'

const staticPath = path.join(getDistPath(), '../..', 'web-app/build')

export default async function gzipStatic(req: Request, res: Response, next: NextFunction) {
  const acceptEncoding = req.headers['accept-encoding'] || ''
  if (!acceptEncoding.includes('gzip')) return next()

  const originalPath = path.join(staticPath, req.url)
  const gzPath = originalPath + '.gz'

  try {
    await fs.promises.access(gzPath, fs.constants.F_OK)
    res.setHeader('Content-Encoding', 'gzip')
    res.setHeader('Content-Type', getMimeType(req.url))
    res.sendFile(gzPath)
  } catch {
    next()
  }
}

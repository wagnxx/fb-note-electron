import express, { NextFunction, Request, Response } from 'express'
import fs from 'fs'
import path from 'path'
import cors from 'cors'
import history from 'connect-history-api-fallback'
import { getDistPath, getSupportPath } from '@/config'
import { getLocalWiFiIP } from '@/utils/netUtils'

const staticPath = path.join(getDistPath(), '../..', 'web-app/build')
const assetsPath = getSupportPath('assets')

const portals = ['/ulogi']

export const createApp = () => {
  // 创建 express 实例
  const server = express()
  server.use(cors())
  server.use((req: Request, res: Response, next: NextFunction) => {
    const portal = portals.find(item => item === req.path)
    if (portal) {
      console.log('[ULOGI] Root matched. Redirecting to index.html')
      req.url = portal + '/'
    }
    next()
  })

  // history fallback 处理 SPA 的页面跳转（必须在 static 之前）
  server.use(
    '/ulogi',
    history({
      index: '/index.html',
    }),
  )

  // 静态资源服务放 fallback 后
  // 使用中间件控制访问路径
  server.use('/ulogi', express.static(staticPath))
  server.use('/assets', express.static(assetsPath)) // 只允许访问 /assets 文件夹

  // 限制访问 /logs
  server.use('/logs', (req: Request, res: Response) => {
    res.status(403).send('Access to logs folder is forbidden')
  })

  // 提供视频流的路由
  server.get('/video', (req: Request, res: Response) => {
    const encodedVideoPath = req.query.src as string

    // 如果没有传递视频路径，返回错误
    if (!encodedVideoPath) {
      return res.status(400).send('No video source provided')
    }

    // 解码路径并解析成绝对路径
    const videoPath = decodeURIComponent(encodedVideoPath) // 解码视频路径
    const resolvedPath = path.resolve(__dirname, videoPath) // 获取视频文件的绝对路径

    // 检查视频文件是否存在
    fs.stat(resolvedPath, (err, stats) => {
      if (err || !stats.isFile()) {
        return res.status(404).send('Video not found')
      }

      const totalSize = stats.size // 获取视频文件的总大小
      const range = req.headers.range // 获取请求中的 Range 请求头
      res.setHeader('Access-Control-Allow-Origin', '*')

      if (range) {
        // 如果请求中包含 Range 请求头，进行字节范围传输
        const match = range.match(/bytes=(\d+)-(\d*)/)
        const start = parseInt(match![1], 10)
        const end = match![2] ? parseInt(match[2], 10) : totalSize - 1
        const chunkSize = end - start + 1

        res.status(206) // Partial Content 状态码
        res.setHeader('Content-Range', `bytes ${start}-${end}/${totalSize}`)
        res.setHeader('Accept-Ranges', 'bytes')
        res.setHeader('Content-Length', chunkSize)
        res.setHeader('Content-Type', 'video/mp4')

        const readStream = fs.createReadStream(resolvedPath, { start, end })
        readStream.pipe(res)
      } else {
        // 如果没有 Range 请求头，返回整个视频
        res.status(200) // OK 状态码
        res.setHeader('Content-Length', totalSize)
        res.setHeader('Content-Type', 'video/mp4')

        const readStream = fs.createReadStream(resolvedPath)
        readStream.pipe(res) // 直接传输整个文件
      }
    })
  })

  server.get('/image', (req: Request, res: Response) => {
    const encodedImagePath = req.query.src as string

    // 如果没有传递图片路径，返回错误
    if (!encodedImagePath) {
      return res.status(400).send('No image source provided')
    }

    // 解码路径并解析成绝对路径
    const imagePath = decodeURIComponent(encodedImagePath) // 解码图片路径
    const resolvedPath = path.resolve(__dirname, imagePath) // 获取图片文件的绝对路径

    // 检查图片文件是否存在
    fs.stat(resolvedPath, (err, stats) => {
      if (err || !stats.isFile()) {
        return res.status(404).send('Image not found')
      }

      const totalSize = stats.size // 获取图片文件的总大小
      res.setHeader('Access-Control-Allow-Origin', '*')

      // 返回整个图片文件
      res.status(200) // OK 状态码
      res.setHeader('Content-Length', totalSize)

      // 根据图片的实际类型设置正确的 Content-Type
      const extname = path.extname(resolvedPath).toLowerCase()
      if (extname === '.jpg' || extname === '.jpeg') {
        res.setHeader('Content-Type', 'image/jpeg')
      } else if (extname === '.png') {
        res.setHeader('Content-Type', 'image/png')
      } else if (extname === '.gif') {
        res.setHeader('Content-Type', 'image/gif')
      } else {
        return res.status(415).send('Unsupported image format')
      }

      // 读取并返回图片文件
      const readStream = fs.createReadStream(resolvedPath)
      readStream.pipe(res)
    })
  })

  server.get('/wifiIP', (req: Request, res: Response) => {
    const alias = getLocalWiFiIP()
    res.status(200)
    res.send(alias)
  })

  // getLocalWiFiIP

  server.get('/test', (req: Request, res: Response) => {
    res.send('raa -')
  })

  return server
}

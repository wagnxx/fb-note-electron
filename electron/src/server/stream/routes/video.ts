import { Request, Response, Router } from 'express'
import fs from 'fs'
import path from 'path'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  const encodedVideoPath = req.query.src as string

  // 如果没有传递视频路径，返回错误
  if (!encodedVideoPath) {
    res.status(400).send('No video source provided')
    return
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
      const end = match?.[2] ? parseInt(match[2], 10) : totalSize - 1
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
export default router

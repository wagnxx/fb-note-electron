import { Request, Response, Router } from 'express'
import express, { NextFunction } from 'express'
import fs from 'fs'
import path from 'path'

const router = Router()
router.get('/', (req: Request, res: Response) => {
  const encodedImagePath = req.query.src as string

  // 如果没有传递图片路径，返回错误
  if (!encodedImagePath) {
    res.status(400).send('No image source provided')
    return
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
export default router

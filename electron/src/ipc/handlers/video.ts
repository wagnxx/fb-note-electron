import path from 'path'
import fs from 'fs'
import { dialog, ipcMain } from 'electron'
import { IPC_ACTIONS } from '@/constants'
import { spawn } from 'child_process'
import { deleteFile, deleteFiles, ensureDirectoryExists, fileExists, writeFile } from '@/utils/fileManager'
import { batchCropImages, mergeImages } from '@/utils/imageUtils'
import { extractFrameAtTime, extractTextFromImage } from '@/utils/imageText'
import { Downloader, DownloadOptions } from '@/utils/Downloader'
import { CropRange } from '@shared/types'
const downloader = new Downloader()

export const setupVideoStreamHandler = () => {
  ipcMain.on(IPC_ACTIONS.LOAD_VIDEO, (event, encodedPath) => {
    const filePath = decodeURIComponent(encodedPath)

    const videoPath = path.resolve(filePath) // 获取文件路径
    const readStream = fs.createReadStream(videoPath)

    readStream.on('data', chunk => {
      event.sender.send('video-stream', chunk) // 将视频流数据传递给渲染进程
    })

    readStream.on('end', () => {
      event.sender.send('video-stream', null) // 流结束后，发送 null 表示结束
    })

    readStream.on('error', err => {
      console.error('视频流读取错误:', err)
      event.sender.send('video-stream', null) // 读取错误时也发送 null
    })
  })

  // 监听下载请求
  ipcMain.on('start-download', (event, options: DownloadOptions) => {
    downloader.startDownload(event, options)
  })
  ipcMain.handle(IPC_ACTIONS.DOWNLOAD_PAUSE, (event, videoId: string) => {
    return downloader.pauseDownload(videoId)
  })

  ipcMain.handle(IPC_ACTIONS.DOWNLOAD_RESUME, (event, videoId: string) => {
    return downloader.resumeDownload(videoId)
  })

  ipcMain.handle(IPC_ACTIONS.DOWNLOAD_CANCEL, (event, videoId: string) => {
    return downloader.cancelDownload(videoId)
  })

  ipcMain.handle(IPC_ACTIONS.SAVE_SCREENSHOT, async (event, { dataURL, enVideoPath, enFolder, name }) => {
    try {
      const basePath = path.dirname(decodeURIComponent(enVideoPath))

      if (!basePath) {
        return {
          message: 'enVideoPath is not exist',
        }
      }
      // 设置保存路径
      const filePath = path.join(basePath, decodeURIComponent(enFolder), name + '.png')

      // 获取文件夹路径（不包括文件名）
      const dirPath = path.dirname(filePath)

      await ensureDirectoryExists(dirPath)

      // 移除 dataURL 前缀并转换为 Buffer
      const base64Data = dataURL.replace(/^data:image\/png;base64,/, '')
      const buffer = Buffer.from(base64Data, 'base64')
      await writeFile(filePath, buffer)

      // 返回文件路径给前端
      return { filePath }
    } catch (error) {
      console.error('Error saving screenshot:', error)
      throw error // 抛出错误，前端可以捕获
    }
  })

  ipcMain.handle(IPC_ACTIONS.REMOVE_SCREENSHOT, async (event, { enPaths }: { enPaths: string[] }) => {
    const filePaths = enPaths.map(enPath => decodeURIComponent(enPath))
    return await deleteFiles(filePaths)
  })
  ipcMain.handle(
    IPC_ACTIONS.BATCH_CROP_IMAGE,
    async (
      event,
      {
        filePaths,
        cropRange,
        needDecode = false,
      }: {
        filePaths: string[] | { path: string; cropRange: CropRange }[]
        cropRange?: CropRange
        needDecode?: boolean
      },
    ) => {
      return await batchCropImages({ filePaths, cropRange, needDecode })
    },
  )
  ipcMain.handle(
    IPC_ACTIONS.MERGE_IMAGES,
    async (
      event,
      {
        enFolder,
        layout,
        images,
        mergedName,
      }: {
        enFolder: string
        layout: 'col' | 'row'
        images: Array<{ enPath: string; width: number; height: number }>
        mergedName: string
      },
    ) => {
      const folder = decodeURIComponent(enFolder)
      const transPathImages = images.map(item => ({
        path: decodeURIComponent(item.enPath),
        width: item.width,
        height: item.height,
      }))

      return await mergeImages({
        folder,
        layout,
        images: transPathImages,
        mergedName,
      })
    },
  )
  ipcMain.handle(IPC_ACTIONS.EXRACT_IMAGES_TEXT, async (event, { enPaths }: { enPaths: string[] }) => {
    const paths = enPaths.map(p => decodeURIComponent(p))
    const promises = paths.map(item => {
      return extractTextFromImage(item)
    })
    return Promise.all(promises)
  })
  ipcMain.handle(IPC_ACTIONS.COMPARE_IMAGES, async (event, { enPaths }: { enPaths: string[] }) => {
    const paths = enPaths.map(p => decodeURIComponent(p))
  })
  ipcMain.handle(
    IPC_ACTIONS.EXRACT_VIDEO_FRAME_TEXT,
    async (event, { enVideoPath, time, name }: { enVideoPath: string; time: number; name: string }) => {
      const videoPath = decodeURIComponent(enVideoPath)
      const outputImagePath = path.join(path.dirname(videoPath), 'frames', name + '.png')
      await extractFrameAtTime(videoPath, time, outputImagePath)
      return extractTextFromImage(outputImagePath)
    },
  )
}

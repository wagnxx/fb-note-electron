import { spawn, ChildProcessWithoutNullStreams } from 'child_process'
import path from 'path'

// 定义类型
export interface DownloadOptions {
  videoUrl: string
  enDownloadDir: string
  videoId: string
}

class Downloader {
  private processMap: Map<string, ChildProcessWithoutNullStreams> = new Map()

  public startDownload(event: Electron.IpcMainEvent, { videoUrl, enDownloadDir, videoId }: DownloadOptions): void {
    const downloadDir = decodeURIComponent(enDownloadDir)

    // 获取视频标题和扩展名
    this.getVideoInfo(videoUrl)
      .then(({ title, ext }) => {
        const videoTitle = title || 'unknown_title' // 如果未获取标题，则使用默认值
        const outputPath = path.join(downloadDir, `${videoTitle}.${ext}`)

        event.reply('download-title', { videoId, videoTitle, outputPath })

        this.downloadVideo(event, videoUrl, outputPath, videoId)
      })
      .catch(error => {
        console.error('获取视频信息失败:', error.message)
        event.reply('download-error', {
          videoId,
          errorMessage: '获取视频信息失败',
        })
      })
  }

  private getVideoInfo(videoUrl: string): Promise<{ title: string; ext: string }> {
    return new Promise((resolve, reject) => {
      let title = ''
      let ext = ''

      // 使用 yt-dlp 获取视频标题和扩展名
      const ytDlpCmd = spawn('yt-dlp', ['--print', '%(title)s\n%(ext)s', videoUrl])

      ytDlpCmd.stdout.on('data', data => {
        const [fetchedTitle, fetchedExt] = data.toString().trim().split('\n')
        title = fetchedTitle || ''
        ext = fetchedExt || ''
      })

      ytDlpCmd.stderr.on('data', data => {
        console.error(`yt-dlp error: ${data}`)
      })

      ytDlpCmd.on('close', code => {
        if (code === 0) {
          resolve({ title, ext })
        } else {
          reject(new Error('yt-dlp 获取视频信息失败'))
        }
      })
    })
  }

  private downloadVideo(event: Electron.IpcMainEvent, videoUrl: string, outputPath: string, videoId: string): void {
    const ytDlpDownloadCmd = spawn('yt-dlp', ['-o', outputPath, videoUrl])
    this.processMap.set(videoId, ytDlpDownloadCmd)

    ytDlpDownloadCmd.stdout.on('data', data => {
      const output = data.toString()
      const progressMatch = output.match(/(\d+\.\d+)%/)
      if (progressMatch) {
        const progress = progressMatch[1]
        event.reply('download-progress', {
          videoId,
          progress,
          path: outputPath,
        })
      }
    })

    ytDlpDownloadCmd.stderr.on('data', data => {
      console.error(`yt-dlp error: ${data}`)
      event.reply('download-error', { videoId, errorMessage: '下载失败' })
    })

    ytDlpDownloadCmd.on('close', code => {
      this.processMap.delete(videoId)
      if (code === 0) {
        console.log(`下载完成: ${outputPath}`)
        event.reply('download-complete', { videoId, path: outputPath })
      } else {
        event.reply('download-error', { videoId, errorMessage: '下载失败' })
      }
    })
  }

  public pauseDownload(videoId: string): boolean {
    const process = this.processMap.get(videoId)
    if (process) {
      process.kill('SIGSTOP')
      return true
    }
    return false
  }

  public resumeDownload(videoId: string): boolean {
    const process = this.processMap.get(videoId)
    if (process) {
      process.kill('SIGCONT')
      return true
    }
    return false
  }

  public cancelDownload(videoId: string): boolean {
    const process = this.processMap.get(videoId)
    if (process) {
      process.kill('SIGTERM')
      this.processMap.delete(videoId)
      return true
    }
    return false
  }
}

export { Downloader }

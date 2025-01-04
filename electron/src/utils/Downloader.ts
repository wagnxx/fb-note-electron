import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { ipcMain } from 'electron';
import path from 'path';

// 定义类型
export interface DownloadOptions {
  videoUrl: string;
  enDownloadDir: string;
  videoId: string;
}

class Downloader {
  private processMap: Map<string, ChildProcessWithoutNullStreams> = new Map();

  public startDownload(event: Electron.IpcMainEvent, { videoUrl, enDownloadDir, videoId }: DownloadOptions): void {
    let videoTitle = '';
    const downloadDir = decodeURIComponent(enDownloadDir)

    // 使用 yt-dlp 获取视频标题
    const ytDlpCmd = spawn('yt-dlp', ['-e', videoUrl]);

    ytDlpCmd.stdout.on('data', (data) => {
      videoTitle = data.toString().trim();
      console.log('视频标题:', videoTitle);
    });

    ytDlpCmd.stderr.on('data', (data) => {
      console.error(`yt-dlp error: ${data}`);
    });

    ytDlpCmd.on('close', (code) => {
      if (code !== 0) {
        event.reply('download-error', { videoId, errorMessage: '获取视频标题失败' });
        return;
      }

      event.reply('download-title', { videoId, videoTitle });

      const outputPath = path.join(downloadDir, `${videoTitle}.mp4`);

      const ytDlpDownloadCmd = spawn('yt-dlp', ['-o', outputPath, videoUrl]);
      this.processMap.set(videoId, ytDlpDownloadCmd);

      ytDlpDownloadCmd.stdout.on('data', (data) => {
        const output = data.toString();
        const progressMatch = output.match(/(\d+\.\d+)%/);
        if (progressMatch) {
          const progress = progressMatch[1];
          event.reply('download-progress', { videoId, progress, path: outputPath });
        }
      });

      ytDlpDownloadCmd.on('close', (code) => {
        this.processMap.delete(videoId);
        if (code === 0) {
          event.reply('download-complete', { videoId, path: outputPath });
        } else {
          event.reply('download-error', { videoId, errorMessage: '下载失败' });
        }
      });

      ytDlpDownloadCmd.stderr.on('data', (data) => {
        console.error(`yt-dlp error: ${data}`);
        event.reply('download-error', { videoId, errorMessage: '下载失败' });
      });
    });
  }

  public pauseDownload(videoId: string): boolean {
    const process = this.processMap.get(videoId);
    if (process) {
      process.kill('SIGSTOP');
      return true;
    }
    return false;
  }

  public resumeDownload(videoId: string): boolean {
    const process = this.processMap.get(videoId);
    if (process) {
      process.kill('SIGCONT');
      return true;
    }
    return false;
  }

  public cancelDownload(videoId: string): boolean {
    const process = this.processMap.get(videoId);
    if (process) {
      process.kill('SIGTERM');
      this.processMap.delete(videoId);
      return true;
    }
    return false;
  }
}

export {

    Downloader
} 
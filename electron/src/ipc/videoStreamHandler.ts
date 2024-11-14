import path from 'path';
import fs from 'fs';
import { dialog, ipcMain } from 'electron'
import { IPC_ACTIONS } from '../constants';
import { spawn } from 'child_process';
import { deleteFile, deleteFiles, ensureDirectoryExists, fileExists, writeFile } from '../utils/fileManager';


export const setupVideoStreamHandler = () => {
    ipcMain.on(IPC_ACTIONS.LOAD_VIDEO, (event, encodedPath) => {
        const filePath = decodeURIComponent(encodedPath);

        const videoPath = path.resolve(filePath); // 获取文件路径
        const readStream = fs.createReadStream(videoPath);

        readStream.on('data', (chunk) => {
            event.sender.send('video-stream', chunk); // 将视频流数据传递给渲染进程
        });

        readStream.on('end', () => {
            event.sender.send('video-stream', null); // 流结束后，发送 null 表示结束
        });

        readStream.on('error', (err) => {
            console.error('视频流读取错误:', err);
            event.sender.send('video-stream', null); // 读取错误时也发送 null
        });
    });


    // 监听下载请求
    ipcMain.on('start-download', (event, { videoUrl, downloadDir, videoId }) => {
        let videoTitle = ''; // 变量来存储视频的标题

        // 使用 yt-dlp 命令获取视频标题
        const ytDlpCmd = spawn('yt-dlp', ['-e', videoUrl]); // -e 用来获取视频的标题（不下载视频）

        ytDlpCmd.stdout.on('data', (data) => {
            videoTitle = data.toString().trim(); // 获取视频标题并去除空白字符
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

            // 生成视频下载路径
            const outputPath = path.join(downloadDir, `${videoTitle}.mp4`);

            // 使用 yt-dlp 下载视频
            const ytDlpDownloadCmd = spawn('yt-dlp', [
                '-o', outputPath, // 设置输出路径
                videoUrl // YouTube 视频链接
            ]);

            // 监听 yt-dlp 输出的实时进度
            ytDlpDownloadCmd.stdout.on('data', (data) => {
                const output = data.toString();
                const progressMatch = output.match(/(\d+\.\d+)%/); // 匹配进度百分比
                if (progressMatch) {
                    const progress = progressMatch[1];
                    event.reply('download-progress', { videoId, progress, path: outputPath });
                }
            });

            // 监听下载完成
            ytDlpDownloadCmd.on('close', (code) => {
                if (code === 0) {
                    event.reply('download-complete', { videoId, path: outputPath });
                } else {
                    event.reply('download-error', { videoId, errorMessage: '下载失败' });
                }
            });

            // 监听下载错误
            ytDlpDownloadCmd.stderr.on('data', (data) => {
                console.error(`yt-dlp error: ${data}`);
                event.reply('download-error', { videoId, errorMessage: '下载失败' });
            });
        });
    });

    ipcMain.handle(IPC_ACTIONS.SAVE_SCREENSHOT, async (event, { dataURL, enVideoPath, enFolder, name }) => {
        try {
            const basePath = path.dirname(decodeURIComponent(enVideoPath))

            if (!basePath) {
                return {
                    message: 'enVideoPath is not exist'
                }
            }
            // 设置保存路径
            const filePath = path.join(basePath, decodeURIComponent(enFolder), name + '.png');

            // 获取文件夹路径（不包括文件名）
            const dirPath = path.dirname(filePath);

            await ensureDirectoryExists(dirPath)

            // 移除 dataURL 前缀并转换为 Buffer
            const base64Data = dataURL.replace(/^data:image\/png;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            await writeFile(filePath, buffer)


            // 返回文件路径给前端
            return { filePath };
        } catch (error) {
            console.error('Error saving screenshot:', error);
            throw error;  // 抛出错误，前端可以捕获
        }
    });

    ipcMain.handle(IPC_ACTIONS.REMOVE_SCREENSHOT, async (event, { enPaths }: { enPaths: string[] }) => {
        const filePaths = enPaths.map(enPath => decodeURIComponent(enPath))
        return await deleteFiles(filePaths)
    })
};

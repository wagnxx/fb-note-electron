/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import { config } from 'dotenv';
config();
import { app, BrowserWindow, dialog, ipcMain, IpcMainEvent, session } from 'electron';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { IPC_ACTIONS } from './constants';
import { createLogger, format, transports } from 'winston';
import { startVideoStreamServer } from './server/stream/expressApp';



const SUPPORT_DIR = process.env.SUPPORT_DIR || 'support';
const isDev = process.env.ELECTRON_START_URL !== undefined;
const platform = process.platform;
const preloadPath = isDev
  ? path.join(__dirname, '..', 'preload.js')
  : path.join(__dirname, '../..', SUPPORT_DIR, 'preload', 'preload.js');

const SOCKS_RELATIVE_PATH = isDev
  ? '../socks-server.js'
  : platform === 'win32'
    ? path.join('../../', SUPPORT_DIR, 'build-service', 'socks-server-win.exe')
    : platform === 'darwin'
      ? path.join('../..', SUPPORT_DIR, 'build-service', 'socks-server-macos')
      : path.join('../..', SUPPORT_DIR, 'build-service', 'socks-server-linux');

const LOG_FILE_PATH = isDev
  ? path.join(__dirname, '..', 'logs/error.log')
  : path.join(__dirname, '../..', SUPPORT_DIR, 'logs/error.log');

const pidFile = isDev
  ? path.join(__dirname, '..', 'temps', 'socks_service.pid')
  : path.join(__dirname, '../..', SUPPORT_DIR, 'temps', 'socks_service.pid');

const infoFile = isDev
  ? path.join(__dirname, '..', 'temps', 'socks_service_info.json')
  : path.join(__dirname, '../..', SUPPORT_DIR, 'temps', 'socks_service_info.json');

// 创建日志记录器
const logger = createLogger({
  level: 'error',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.File({ filename: LOG_FILE_PATH })
  ],
});

let socksProcess: ChildProcess | null = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: preloadPath,
      // nodeIntegration: false,
      // contextIsolation: true,
      // webSecurity: false,
      disableBlinkFeatures: 'Autofill',
      allowRunningInsecureContent: true,
      devTools: true,
    },
  });

  win.webContents.openDevTools();


  if (isDev) {
    win.loadURL(process.env.ELECTRON_START_URL!);
  } else {
    win.loadFile(path.join(__dirname, '../../web-app/build/index.html'));
  }
}

// 启动 HTTP 服务
startVideoStreamServer();

app?.whenReady()?.then(() => {
  createWindow();

  // 启动 SOCKS 服务
  ipcMain.on(IPC_ACTIONS.START_SOCKS_SERVICE, (event: IpcMainEvent, { payload: { address, port }, action = null }: { payload: { address: string, port: number }, action?: string | null }) => {
    try {
      if (!socksProcess) {
        console.log("address, port", address, port);

        socksProcess = isDev
          ? spawn('node', [path.join(__dirname, SOCKS_RELATIVE_PATH), address, port.toString()])
          : spawn(path.join(__dirname, SOCKS_RELATIVE_PATH), [address, port.toString()]);

        socksProcess.stdout?.on('data', (data) => {
          const output = data.toString();
          console.log(`SOCKS 服务输出: ${output}`);
          event.sender.send(IPC_ACTIONS.SOCKS_SERVICE_OUTPUT, output);

          try {
            const parsedData = JSON.parse(output);
            console.log('parsedData:::', parsedData);
            if (parsedData?.type === 'write_pid_to_temp') {
              event.sender.send(IPC_ACTIONS.SOCKS_SERVICE_OUTPUT, 'SOCKS 启动成功', action);
              const { host, port, pid } = parsedData;
              fs.writeFileSync(pidFile, pid);
              fs.writeFileSync(infoFile, JSON.stringify({ host, port }));
            }
          } catch (error) {
            // console.log('parse output error::', error); 
          }
        });

        socksProcess.stderr?.on('data', (data) => {
          console.error(`SOCKS 服务错误: ${data}`);
          logger.error(data.toString());
          event.sender.send(IPC_ACTIONS.SOCKS_SERVICE_ERROR, data.toString());
        });

        socksProcess.on('close', (code) => {
          console.log(`SOCKS 服务已停止，退出码: ${code}`);
          socksProcess = null;
          event.sender.send(IPC_ACTIONS.SOCKS_SERVICE_STOPPED, `SOCKS 服务已停止，退出码: ${code}`);
        });

        console.log('SOCKS 服务已启动');
      } else {
        console.log('SOCKS 服务已经在运行');
        event.sender.send(IPC_ACTIONS.SOCKS_SERVICE_OUTPUT, 'SOCKS 服务已经在运行 pid:' + socksProcess?.pid?.toString());
      }
    } catch (error) {
      logger.error(error);
      event.sender.send(IPC_ACTIONS.SOCKS_SERVICE_ERROR, '启动服务时发生错误');
    }
  });

  // 监听停止服务的请求
  ipcMain.on(IPC_ACTIONS.STOP_SOCKS_SERVICE, (event: IpcMainEvent, { action = null }: { action?: string | null }) => {
    if (socksProcess) {
      socksProcess.on('exit', () => {
        console.log('SOCKS 服务已停止');
        event.sender.send(IPC_ACTIONS.SOCKS_SERVICE_OUTPUT, 'SOCKS 服务已停止', action);
      });
      socksProcess.kill();
      socksProcess = null;
    } else {
      console.log('SOCKS 服务未运行');
      event.sender.send(IPC_ACTIONS.SOCKS_SERVICE_OUTPUT, 'SOCKS 服务未运行', action);
    }
  });

  ipcMain.handle(IPC_ACTIONS.GET_SOCKS_SERVICE_INFO, async () => {
    return await getSocksServiceInfo();
  });
  ipcMain.handle(IPC_ACTIONS.CHECK_SOCKS_SERVICE, async () => {
    const serviceName = `node ${SOCKS_RELATIVE_PATH}`;
    return await checkService(serviceName);
  });
  ipcMain.handle(IPC_ACTIONS.GET_LOGS, async () => {
    return await getLogs();
  });


  ipcMain.handle(IPC_ACTIONS.SELECT_FILE, async (event, options = { type: 'file' }) => {
    let properties: ('openFile' | 'openDirectory' | 'multiSelections' | 'showHiddenFiles' | 'createDirectory' | 'promptToCreate' | 'noResolveAliases' | 'treatPackageAsDirectory' | 'dontAddToRecent')[] = [];  // 指定为合法的字符串字面量类型


    // 根据传入的参数决定选择文件或文件夹
    if (options.type === 'file') {
      properties = ['openFile'];  // 选择文件
    } else if (options.type === 'directory') {
      properties = ['openDirectory'];  // 选择文件夹
    } else if (options.type === 'both') {
      properties = ['openFile', 'openDirectory'];
    }

    const result = await dialog.showOpenDialog({
      properties: properties,
    });

    if (result.canceled) {
      return null; // 用户取消了选择
    }

    const selectedPaths = result.filePaths;
    if (options.type === 'directory' || options.type === 'both') {
      // 如果选择的是文件夹，返回文件夹路径
      return { path: selectedPaths[0], type: 'directory' };
    }

    // 如果选择的是文件，返回文件路径和文件名
    const filePath = selectedPaths[0];
    const fileName = path.basename(filePath);
    return { path: filePath, name: fileName, type: 'file' };
  });


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



  // 改进的异步生成器，逐步读取文件并返回数据块
  ipcMain.handle('read-stream', async (event, encodedPath) => {
    const filePath = path.resolve(decodeURIComponent(encodedPath));

    // 创建一个生成器实例来按块读取文件
    // const fileChunks = readFileInChunks(filePath);

    // 返回一个迭代器（生成器），渲染进程会用它来逐块读取数据
    // return fileChunks;
    const fileStream = fs.readFileSync(filePath)
    return fileStream
  });

  ipcMain.handle(IPC_ACTIONS.SAVE_SCREENSHOT, async (event, { dataURL, enVideoPath, enFolder, name }) => {
    try {
      // 移除 dataURL 前缀并转换为 Buffer
      const base64Data = dataURL.replace(/^data:image\/png;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

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

      // 判断文件夹是否存在，不存在则创建
      if (!fs.existsSync(dirPath)) {
        // 创建文件夹，递归创建不存在的父文件夹
        fs.mkdirSync(dirPath, { recursive: true });
      }

      // 保存文件
      await new Promise((resolve, reject) => {
        fs.writeFile(filePath, buffer, (err) => {
          if (err) {
            console.error('Failed to save screenshot:', err);
            reject(err);  // 如果保存失败，抛出异常
          } else {
            console.log('Screenshot saved successfully:', filePath);
            resolve(filePath);  // 成功时返回文件路径
          }
        });
      });

      // 返回文件路径给前端
      return { filePath };
    } catch (error) {
      console.error('Error saving screenshot:', error);
      throw error;  // 抛出错误，前端可以捕获
    }
  });

  app.on('activate', () => {
    console.log('app window activate');
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (socksProcess) {
    socksProcess.kill();
  }
});

// 捕获未处理的异常
process.on('uncaughtException', (error) => {
  logger.error(error);
});

// 捕获未处理的拒绝
process.on('unhandledRejection', (error) => {
  logger.error(error);
});

/**
 * 检查指定服务是否正在运行
 * @param {string} serviceName - 
 * @returns {Promise<boolean>} - 返回一个 Promise，表示服务是否在运行
 */
function checkService(serviceName: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    exec(`pgrep -f ${serviceName}`, (error, stdout) => {
      if (error) {
        return reject(error);
      }
      const isRunning = stdout.trim() !== '';
      resolve(isRunning);
    });
  });
}

function getLogs() {
  try {
    const data = fs.readFileSync(LOG_FILE_PATH, 'utf-8');
    const lines = data.split('\n').filter(line => line.trim());
    const logs = lines.map(line => {
      try {
        return JSON.parse(line);
      } catch (parseErr) {
        return { error: `无法解析日志行: ${(parseErr as Error).message}`, line };
      }
    });
    return { logs };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

function getSocksServiceInfo() {
  const data = {
    host: '',
    port: '',
    isRunning: false,
    message: ''
  };

  try {
    const jsonData = fs.readFileSync(infoFile, 'utf-8');
    const parsedData = JSON.parse(jsonData);
    data.host = parsedData.host;
    data.port = parsedData.port;
  } catch (error) {
    logger.error(`Failed to read or parse ${infoFile}: ${(error as Error).message}`);
  }

  if (fs.existsSync(pidFile)) {
    const pid = parseInt(fs.readFileSync(pidFile, 'utf-8'), 10);

    try {
      process.kill(pid, 0); // 检查进程是否仍然存在
      data.isRunning = true;
    } catch (err) {
      const message = `Process with PID ${pid} is not running.`;
      logger.error(message);
      data.isRunning = false;
      data.message = message;
    }
  } else {
    data.message = 'No PID file found.';
  }

  return data;
}
// 生成器函数，用于按块读取文件
async function* readFileInChunks(filePath: string, chunkSize = 1024 * 1024) {
  const stream = fs.createReadStream(filePath, { highWaterMark: chunkSize });

  for await (const chunk of stream) {
    yield chunk; // 每次读取一个块
  }
}



// 解析 ffmpeg 输出中的进度信息
function parseProgress(output: string): string | null {
  const regex = /time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/; // 正则表达式匹配时间
  const match = output.match(regex);

  if (match) {
    const hours = match[1];
    const minutes = match[2];
    const seconds = match[3];
    return `${hours}:${minutes}:${seconds}`;
  }

  return null; // 如果没有找到进度，返回 null
}
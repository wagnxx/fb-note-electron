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
import { startVideoStreamServer } from './videoStream';



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
  ipcMain.handle(IPC_ACTIONS.SELECT_FILE, async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile']
    });

    if (result.canceled) {
      return null; // 用户取消了选择
    }

    const filePath = result.filePaths[0]; // 获取文件路径
    const fileName = path.basename(filePath); // 获取文件名

    return { path: filePath, name: fileName }; // 返回文件路径和文件名
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

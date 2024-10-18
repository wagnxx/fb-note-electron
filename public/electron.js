/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { SERVICE_NAMES, IPC_ACTIONS } = require('./constants');
const { createLogger, format, transports } = require('winston');

const LOG_FILE_PATH =  path.join(__dirname, 'logs/error.log')
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

let socksProcess;


function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false, // 确保安全性
      contextIsolation: true,
    },
  });

  win.loadURL('http://localhost:3000'); // 替换为你的 React 应用或 URL
}

app.whenReady().then(() => {
  createWindow();

  // 启动 SOCKS 服务
  ipcMain.on(IPC_ACTIONS.START_SOCKS_SERVICE, (event, { payload : {address, port} }) => {
    if (!socksProcess) {
      console.log("address, port", address, port);
      socksProcess = spawn('node', [path.join(__dirname, SERVICE_NAMES.socks5), address, port]);

      // 将子进程的输出通过 IPC 发送到渲染进程
      socksProcess.stdout.on('data', (data) => {
        console.log(`SOCKS 服务输出: ${data}`);
        event.sender.send(IPC_ACTIONS.SOCKS_SERVICE_OUTPUT, data.toString());
      });

      socksProcess.stderr.on('data', (data) => {
        console.error(`SOCKS 服务错误: ${data}`);
        logger.error(data.toString())
        event.sender.send(IPC_ACTIONS.SOCKS_SERVICE_ERROR, data.toString());
      });

      socksProcess.on('close', (code) => {
        console.log(`SOCKS 服务已停止，退出码: ${code}`);
        socksProcess = null;
        event.sender.send(IPC_ACTIONS.SOCKS_SERVICE_STOPPED, `SOCKS 服务已停止，退出码: ${code}`);
      });

      socksProcess.on('message', (msg) => {
        if (msg.type === IPC_ACTIONS.START_SOCKS_SERVICE) {
          event.sender.send(IPC_ACTIONS.START_SOCKS_SERVICE, msg.message);
        } else if (msg.type === IPC_ACTIONS.SOCKS_SERVICE_ERROR) {
          event.sender.send(IPC_ACTIONS.SOCKS_SERVICE_ERROR, msg.message);
        }
      });

      console.log('SOCKS 服务已启动');
    } else {
      console.log('SOCKS 服务已经在运行');
      event.sender.send('socks-service-output', 'SOCKS 服务已经在运行');
    }
  });

  // 监听停止服务的请求
  ipcMain.on(IPC_ACTIONS.STOP_SOCKS_SERVICE, (event) => {
    if (socksProcess) {
      socksProcess.kill();
      socksProcess = null;
      console.log('SOCKS 服务已停止');
      event.sender.send('socks-service-stopped', 'SOCKS 服务已停止');
    } else {
      console.log('SOCKS 服务未运行');
      event.sender.send('socks-service-output', 'SOCKS 服务未运行');
    }
  });

  ipcMain.handle(IPC_ACTIONS.GET_SOCKS_SERVICE_INFO, async () => {
    const serviceName = SERVICE_NAMES.socks5;
    return await getSocksServiceInfo(serviceName);
  });
  ipcMain.handle(IPC_ACTIONS.CHECK_SOCKS_SERVICE, async () => {
    const serviceName = `node ${SERVICE_NAMES.socks5}`;
    return await checkService(serviceName);
  });
  ipcMain.handle(IPC_ACTIONS.GET_LOGS, async () => {
    return await getLogs();
  });



  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
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
function checkService(serviceName) {
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
        return { error: `无法解析日志行: ${parseErr.message}`, line };
      }
    });
    return { logs };
  } catch (err) {
    return { error: err.message };
  }
}

function getSocksServiceInfo() {
  const pidFile = path.join(__dirname, 'socks_service.pid');
  const infoFile = path.join(__dirname, 'socks_service_info.json');

  if (fs.existsSync(pidFile)) {
    const pid = parseInt(fs.readFileSync(pidFile, 'utf-8'), 10);

    try {
      process.kill(pid, 0); // 检查进程是否仍然存在

      // 读取 host 和 port
      const data = fs.readFileSync(infoFile, 'utf-8');
      const { host, port } = JSON.parse(data);
      return { isRunning: true, host, port };
    } catch (err) {
      // 进程不存在
      console.error(`Process with PID ${pid} is not running.`);
      return { isRunning: false };
    }
  } else {
    return { isRunning: false ,message: 'no pid'};
  }
}
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const { exec } = require('child_process');
const { SERVICE_NAMES, IPC_ACTIONS } = require('./constant');

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
  ipcMain.on(IPC_ACTIONS.START_SOCKS_SERVICE, (event, { host, port }) => {
    if (!socksProcess) {
      socksProcess = spawn('node', [path.join(__dirname, SERVICE_NAMES.socks5), host, port]);

      // 将子进程的输出通过 IPC 发送到渲染进程
      socksProcess.stdout.on('data', (data) => {
        console.log(`SOCKS 服务输出: ${data}`);
        event.sender.send(IPC_ACTIONS.SOCKS_SERVICE_OUTPUT, data.toString());
      });

      socksProcess.stderr.on('data', (data) => {
        console.error(`SOCKS 服务错误: ${data}`);
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

  ipcMain.handle(IPC_ACTIONS.CHECK_SOCKS_SERVICE, async () => {
    const serviceName = `node ${SERVICE_NAMES.socks5}`;
    return await checkService(serviceName);
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
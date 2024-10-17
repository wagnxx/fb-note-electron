/* eslint-disable  */
const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

let socksProcess; // 保存 SOCKS 进程引用

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // 通过 preload 文件安全地暴露 Node.js API
      contextIsolation: true, // 开启上下文隔离
      enableRemoteModule: false, // 禁用远程模块
      nodeIntegration: false, // 禁用 Node.js 集成
    },
  });

  win.loadURL('http://localhost:3000'); // 替换为你的 React 应用或 URL
}

app.whenReady().then(() => {
  createWindow();

  // 监听渲染进程发来的启动 SOCKS 服务请求
  ipcMain.on('start-socks-service', (event, arg) => {
    console.log('received message from renderIPC', arg);
    event.sender.send('socks-service-output', 'SOCKS 服务准备运行');
  
    if (!socksProcess) {
      socksProcess = spawn('node', ['./my-socks-service.js']); // 替换为实际的服务启动命令

      // 将子进程的输出通过 IPC 发送到渲染进程
      socksProcess.stdout.on('data', (data) => {
        console.log(`SOCKS 服务输出: ${data}`);
        // 发送数据到渲染进程
        event.sender.send('socks-service-output', data.toString());
      });

      socksProcess.stderr.on('data', (data) => {
        console.error(`SOCKS 服务错误: ${data}`);
        // 发送错误到渲染进程
        event.sender.send('socks-service-error', data.toString());
      });

      socksProcess.on('close', (code) => {
        console.log(`SOCKS 服务已停止，退出码: ${code}`);
        socksProcess = null;
        event.sender.send('socks-service-stopped', `SOCKS 服务已停止，退出码: ${code}`);
      });

      console.log('SOCKS 服务已启动');
      event.sender.send('socks-service-output', 'SOCKS 服务已启动');
    } else {
      console.log('SOCKS 服务已经在运行');
      event.sender.send('socks-service-output', 'SOCKS 服务已经在运行');
    }
  });

  // 监听停止服务的请求
  ipcMain.on('stop-socks-service', (event) => {
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

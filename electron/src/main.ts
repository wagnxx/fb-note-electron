import { config } from 'dotenv';
config();
import { app, BrowserWindow } from 'electron';
import path from 'path';
import { startVideoStreamServer } from './videoStream';
import { preloadPath } from './config/paths';
import { isDev } from './config/config';
import { initializeIPCHandlers } from './ipc/handlers';
import { logger } from './utils/logger';
import { ChildProcess } from 'child_process';
import AppWindowManager from './managers/AppWindowManager';

let innerProcess: ChildProcess[] = []

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: true,
      contextIsolation: true,
      // webSecurity: false,
      disableBlinkFeatures: 'Autofill',
      allowRunningInsecureContent: true,
      devTools: true,
    },
  });

  win.webContents.openDevTools();


  if (isDev && process.env.ELECTRON_START_URL) {
    win.loadURL(process.env.ELECTRON_START_URL);
  } else {
    win.loadFile(path.join(__dirname, '../../web-app/build/index.html'));
  }

  return win
}

// 启动 HTTP 服务
startVideoStreamServer();

app?.whenReady()?.then(() => {
  const win = createWindow();

  const appWindowManager = AppWindowManager.getInstance();
  appWindowManager.setWinInstance(win)
  appWindowManager.setAppInstance(app); // 设置 app 实例

  innerProcess = initializeIPCHandlers() as ChildProcess[]

  app.on('activate', () => {
    console.log('app window activate');
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (innerProcess?.length) {
    innerProcess.forEach(item => item.kill())
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




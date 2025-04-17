import { config } from 'dotenv';
config();

import { app, BrowserWindow } from 'electron';
import path from 'path';
import { startVideoStreamServer } from './server/stream/expressApp';
import { preloadPath } from './config/paths';
import { isDev, WEB_DEV_URL , WEB_PROD_URL} from './config/config';
import { initializeIPCHandlers } from './ipc/handlers';
import { logger } from './utils/logger';
import { ChildProcess } from 'child_process';
import AppWindowManager from './managers/AppWindowManager';
import HotModuleReloader from './utils/HotModuleReloader';
import chalk from 'chalk';


let innerProcess: ChildProcess[] = []

if (isDev) {
  new HotModuleReloader(path.join(__dirname, '../dist'), {
    include: ['server', 'ipc'],
    exclude: ['main.js'],
    onReload: (mod, filePath) => {
      // 你可以在这里重新执行 handler、router 等
    },
  }).init();
}


function createWindow() {
  // const iconPath = path.join(__dirname, '../assets/icons/icon.icns')

  // console.log('Icon Path:', iconPath); // 输出图标路径
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    titleBarStyle: 'hidden',
    // icon: iconPath, 
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: true,
      // sandbox: false, 
      // webSecurity: false,
      disableBlinkFeatures: 'Autofill',
      // allowRunningInsecureContent: true,
      devTools: isDev,
    },
  });



  
  if (isDev) {
    win.webContents.openDevTools();
    // win.loadURL(process.env.ELECTRON_START_URL);
    // win.loadFile(path.join(__dirname, '../../web-app/build/index.html'));
  } 

  return win
}


app?.whenReady()?.then(() => {
  const appWindowManager = AppWindowManager.getInstance();
  // 启动 HTTP 服务
  startVideoStreamServer().then(() => {
    const win = createWindow();
    // win.loadURL(isDev ? WEB_DEV_URL! : WEB_PROD_URL)
    win.loadURL( WEB_DEV_URL + '/ulogi')
    appWindowManager.setWinInstance(win)
    appWindowManager.setAppInstance(app); // 设置 app 实例

  });


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




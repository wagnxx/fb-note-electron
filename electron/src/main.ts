import { config } from 'dotenv'
import path from 'path'
config({ path: path.resolve(__dirname, '../.env') })

import { app, BrowserWindow } from 'electron'
import { preloadPath } from './config/paths'
import { isDev, WEB_DEV_URL, WEB_PROD_URL } from './config/config'
import { initializeIPCHandlers } from './ipc'
import { logger } from './utils/logger'
import { ChildProcess } from 'child_process'
import AppWindowManager from './managers/AppWindowManager'
import HotModuleReloader from './utils/HotModuleReloader'
import chalk from 'chalk'
import streamServer from './server/stream/server'

let innerProcess: ChildProcess[] = []

// HMR 逻辑和服务重启
function runHMR() {
  const reloader = new HotModuleReloader(path.join(__dirname, '../dist'), {
    // include: ['server'],
    exclude: ['main.js'],
    onReload: async (_mod: any, filePath: string) => {
      // console.log('update ::::: ', _mod, filePath);
      if (filePath.indexOf('server/stream/expressApp.js') > -1) {
        console.log('update ::::: server/stream/expressApp.js')
        try {
          await streamServer.restart()
          console.log('[HMR] New video stream server started.')
        } catch (err) {
          console.error('[HMR] Failed to restart video stream server:', err)
        }
      }
    },
  })

  reloader.init()
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
  })

  return win
}

app?.whenReady()?.then(() => {
  const appWindowManager = AppWindowManager.getInstance()
  // 启动 HTTP 服务
  streamServer.restart().then(() => {
    const win = createWindow()
    if (isDev) {
      win.webContents.openDevTools()
      runHMR()
    }
    win.loadURL(isDev ? WEB_DEV_URL! : WEB_PROD_URL)
    appWindowManager.setWinInstance(win)
    appWindowManager.setAppInstance(app) // 设置 app 实例
  })

  innerProcess = initializeIPCHandlers() as ChildProcess[]

  app.on('activate', () => {
    console.log('app window activate')
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  if (innerProcess?.length) {
    innerProcess.forEach(item => item.kill())
  }
})

// 捕获未处理的异常
process.on('uncaughtException', error => {
  logger.error(error)
})

// 捕获未处理的拒绝
process.on('unhandledRejection', error => {
  logger.error(error)
})

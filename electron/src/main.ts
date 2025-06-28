import path from 'path'
import { app, BrowserWindow } from 'electron'
import * as config from './config'
import { initializeIPCHandlers } from './ipc'
import { logger } from './utils/logger'
import { ChildProcess } from 'child_process'
import AppWindowManager from './managers/AppWindowManager'
import HotModuleReloader from './utils/HotModuleReloader'
import fs from 'fs'
import { restartModule, startModules } from './core/di/loadModules'
const { isDev, preloadPath, WEB_DEV_URL, WEB_PROD_URL } = config

let innerProcess: ChildProcess[] = []

fs.writeFile(path.join(__dirname, 'partialConfig.json'), JSON.stringify(config, null, 2), () => {})

// HMR 逻辑和服务重启
function runHMR() {
  const reloader = new HotModuleReloader(path.join(config.getDistPath(), 'electron/src'), {
    // include: ['server'],
    exclude: ['main.js'],
    onReload: async (_mod: any, filePath: string) => {
      // console.log('update ::::: ', _mod, filePath);
      // 只重启 http 模块
      if (filePath.includes('modules/http')) {
        try {
          await restartModule('http')
          console.log('[HMR] HTTP module restarted.')
        } catch (err) {
          console.error('[HMR] Failed to restart http module:', err)
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
      devTools: true,
    },
  })

  return win
}

function mountApp() {
  const appWindowManager = AppWindowManager.getInstance()
  const win = createWindow()
  if (isDev) {
    runHMR()
    win.webContents.openDevTools()
  }
  console.log('config =================  ', config)
  win.loadURL(isDev ? WEB_DEV_URL! : WEB_PROD_URL)

  appWindowManager.setWinInstance(win)
  appWindowManager.setAppInstance(app) // 设置 app 实例
}

app.whenReady().then(async () => {
  try {
    // 启动 HTTP 服务
    // await streamServer.restart()
    // 启动模块（包括 http 服务等）
    await startModules()
    mountApp()

    // 初始化 IPC handlers
    innerProcess = initializeIPCHandlers() as ChildProcess[]

    // 激活时重建窗口
    app.on('activate', () => {
      console.log('app window activate')
      if (BrowserWindow.getAllWindows().length === 0) {
        mountApp()
      }
    })
  } catch (error) {
    console.error('[App Init] Failed during startup:', error)
  }
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

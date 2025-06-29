import { app, BrowserWindow } from 'electron'
import * as config from './config'
import { logger } from './utils/logger'
import AppWindowManager from './core/managers/AppWindowManager'
import { startModules, stopModules } from './core/di/loadModules'
import { runHMR } from './core/hmr/initHMR'
const { isDev, preloadPath, WEB_DEV_URL, WEB_PROD_URL } = config

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
    // 启动模块（包括 http 服务等）
    await startModules()
    mountApp()

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
  stopModules()
})

// 捕获未处理的异常
process.on('uncaughtException', error => {
  logger.error(error)
})

// 捕获未处理的拒绝
process.on('unhandledRejection', error => {
  logger.error(error)
})

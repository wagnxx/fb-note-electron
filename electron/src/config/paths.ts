import { getDistPath, getSupportPath, isDev, platform } from './index'

// 类型定义
export const preloadPath: string = getDistPath('preload.js')

export const SOCKS_RELATIVE_PATH: string = isDev
  ? '../../socks-server.js'
  : platform === 'win32'
    ? getSupportPath('build-service', 'socks-server-win.exe')
    : platform === 'darwin'
      ? getSupportPath('build-service', 'socks-server-macos')
      : getSupportPath('build-service', 'socks-server-linux')

export const LOG_FILE_PATH: string = getSupportPath('logs', 'error.log')

export const pidFile: string = getSupportPath('temps', 'socks_service.pid')

export const infoFile: string = getSupportPath('temps', 'socks_service_info.json')

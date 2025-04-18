import path from 'path'
import { isDev, platform, SUPPORT_DIR } from './config'

// 统一路径计算的辅助函数
const getPath = (...segments: string[]): string => {
  if (isDev) {
    return path.join(__dirname, '../..', ...segments)
  }
  return path.join(__dirname, '../../..', SUPPORT_DIR, ...segments)
}
// 统一路径计算的辅助函数 resource 与 app 平级
const getResourcePath = (): string => {
  if (isDev) {
    return path.join(__dirname, '../..', SUPPORT_DIR)
  }
  return path.join(__dirname, '../../..', SUPPORT_DIR)
}
const getSupportPath = (...segments: string[]): string => {
  return path.join(getResourcePath(), ...segments)
}

// 类型定义
export const preloadPath: string = getSupportPath('preload.js')

console.log('preloadPath: ===================================== ==========:  ', preloadPath)

export const SOCKS_RELATIVE_PATH: string = isDev
  ? '../../socks-server.js'
  : platform === 'win32'
    ? getPath('build-service', 'socks-server-win.exe')
    : platform === 'darwin'
      ? getPath('build-service', 'socks-server-macos')
      : getPath('build-service', 'socks-server-linux')

export const LOG_FILE_PATH: string = getSupportPath('logs', 'error.log')

export const pidFile: string = getSupportPath('temps', 'socks_service.pid')

export const infoFile: string = getSupportPath('temps', 'socks_service_info.json')

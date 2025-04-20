import path from 'path'

export const isDev = process.env.ELECTRON_START_URL !== undefined
export const SUPPORT_DIR = process.env.SUPPORT_DIR || 'support'
export const platform = process.platform
export const DOWNLOAD_DIR = process.env.DOWNLOAD_DIR!
export const WEB_DEV_URL = process.env.ELECTRON_START_URL
export const WEB_PROD_URL = process.env.ULOGI_URL!

export const getDistPath = (...segments: string[]): string => {
  if (isDev) {
    return path.join(__dirname, '../../..', ...segments)
  }
  return path.join(__dirname, ...segments) // 压缩后会抹平文件夹层级结构
}

export const getSupportPath = (...segments: string[]): string => {
  return path.join(getDistPath(), isDev ? '..' : '../..', SUPPORT_DIR, ...segments)
}

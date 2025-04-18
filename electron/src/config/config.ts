export const isDev = process.env.ELECTRON_START_URL !== undefined
export const SUPPORT_DIR = process.env.SUPPORT_DIR || 'support'
export const platform = process.platform
export const DOWNLOAD_DIR = process.env.DOWNLOAD_DIR!

export const WEB_DEV_URL = process.env.ELECTRON_START_URL
export const WEB_PROD_URL = process.env.ULOGI_URL!

const path = require('path')
export const isDev = process.env.ELECTRON_START_URL !== undefined

const target = isDev ? path.join(__dirname, 'electron/src/main.js') : path.join(__dirname, 'main.js')

console.log('[entry] loading main process from:', target)
require(target)

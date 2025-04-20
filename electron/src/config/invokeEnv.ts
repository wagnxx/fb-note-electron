import { config } from 'dotenv'
import path from 'path'
export const isDev = process.env.ELECTRON_START_URL !== undefined
config({ path: path.resolve(__dirname, isDev ? '../../..' : '..', '.env') })
export {}

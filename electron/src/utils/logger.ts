import { LOG_FILE_PATH } from '../config/paths'
import { createLogger, format, transports } from 'winston'

// 创建日志记录器
export const logger = createLogger({
  level: 'error',
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.File({ filename: LOG_FILE_PATH })],
})

import { setupFileHandler } from './handlers/file'
import { imageHandler } from './handlers/image'
import { setupSocksHandler } from './handlers/socks'
import { setupVideoStreamHandler } from './handlers/video'


export const initializeIPCHandlers = () => {
  const { socksProcess } = setupSocksHandler() // 配置SOCKS服务IPC事件
  // 配置视频流服务IPC事件
  setupVideoStreamHandler()
  setupFileHandler()
  imageHandler()

  return [socksProcess]
}

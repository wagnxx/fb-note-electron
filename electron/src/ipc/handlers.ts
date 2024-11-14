import { setupFileHandler } from './fileHandlers';
import { setupSocksHandler } from './socksHandler';
import { setupVideoStreamHandler } from './videoStreamHandler';
// import { setupVideoStreamHandler } from './videoStreamHandler';

export const initializeIPCHandlers = () => {
    const { socksProcess } = setupSocksHandler(); // 配置SOCKS服务IPC事件
    // 配置视频流服务IPC事件
    setupVideoStreamHandler()
    setupFileHandler()


    return [socksProcess]
};

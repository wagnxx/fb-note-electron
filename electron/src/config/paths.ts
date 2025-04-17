import path from "path";
import { isDev, platform, SUPPORT_DIR } from "./config";



// 统一路径计算的辅助函数
const getPath = (...segments: string[]): string => {
    if (isDev) {
        return path.join(__dirname, '../..', ...segments);
    }
    return path.join(__dirname, '../../..', SUPPORT_DIR, ...segments);
};

// 类型定义
export const preloadPath: string = isDev
    ? path.join(__dirname, '../../', 'preload.js')
    : getPath('preload.js');

export const SOCKS_RELATIVE_PATH: string = isDev
    ? '../../socks-server.js'
    : platform === 'win32'
        ? getPath('build-service', 'socks-server-win.exe')
        : platform === 'darwin'
            ? getPath('build-service', 'socks-server-macos')
            : getPath('build-service', 'socks-server-linux');

export const LOG_FILE_PATH: string = getPath('logs', 'error.log');

export const pidFile: string = getPath('temps', 'socks_service.pid');

export const infoFile: string = getPath('temps', 'socks_service_info.json');

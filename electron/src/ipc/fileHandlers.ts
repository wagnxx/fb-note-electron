import path from 'path';
import fs from 'fs';
import { dialog, ipcMain } from 'electron'
import { IPC_ACTIONS } from '../constants';
import { spawn } from 'child_process';

export const setupFileHandler = () => {
    ipcMain.handle(IPC_ACTIONS.SELECT_FILE, async (event, options = { type: 'file' }) => {
        let properties: ('openFile' | 'openDirectory' | 'multiSelections' | 'showHiddenFiles' | 'createDirectory' | 'promptToCreate' | 'noResolveAliases' | 'treatPackageAsDirectory' | 'dontAddToRecent')[] = [];  // 指定为合法的字符串字面量类型


        // 根据传入的参数决定选择文件或文件夹
        if (options.type === 'file') {
            properties = ['openFile'];  // 选择文件
        } else if (options.type === 'directory') {
            properties = ['openDirectory'];  // 选择文件夹
        } else if (options.type === 'both') {
            properties = ['openFile', 'openDirectory'];
        }

        const result = await dialog.showOpenDialog({
            properties: properties,
        });

        if (result.canceled) {
            return null; // 用户取消了选择
        }

        const selectedPaths = result.filePaths;
        if (options.type === 'directory' || options.type === 'both') {
            // 如果选择的是文件夹，返回文件夹路径
            return { path: selectedPaths[0], type: 'directory' };
        }

        // 如果选择的是文件，返回文件路径和文件名
        const filePath = selectedPaths[0];
        const fileName = path.basename(filePath);
        return { path: filePath, name: fileName, type: 'file' };
    });



    // 改进的异步生成器，逐步读取文件并返回数据块
    ipcMain.handle('read-stream', async (event, encodedPath) => {
        const filePath = path.resolve(decodeURIComponent(encodedPath));

        // 创建一个生成器实例来按块读取文件
        // const fileChunks = readFileInChunks(filePath);

        // 返回一个迭代器（生成器），渲染进程会用它来逐块读取数据
        // return fileChunks;
        const fileStream = fs.readFileSync(filePath)
        return fileStream
    });


};

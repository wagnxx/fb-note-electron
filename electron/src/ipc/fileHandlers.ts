import path from 'path';
import fs from 'fs';
import { dialog, ipcMain } from 'electron'
import { IPC_ACTIONS } from '../constants';
import { spawn } from 'child_process';
import { fileExists, getDirectoryStructureSync, readDirectory } from '../utils/fileManager';
import mammoth from 'mammoth';

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
    ipcMain.handle(IPC_ACTIONS.READ_STREAM, async (event, encodedPath) => {
        const filePath = path.resolve(decodeURIComponent(encodedPath));

        // 创建一个生成器实例来按块读取文件
        // const fileChunks = readFileInChunks(filePath);

        // 返回一个迭代器（生成器），渲染进程会用它来逐块读取数据
        // return fileChunks;
        const fileStream = fs.readFileSync(filePath)
        return fileStream
    });

    ipcMain.handle(IPC_ACTIONS.LS_FOLDER, async (event, enFolderPath) => {
        const filePath = path.resolve(decodeURIComponent(enFolderPath));

        return await readDirectory(filePath)
    });
    ipcMain.handle(IPC_ACTIONS.GET_DIRECTORY_STRUCTURE, async (event, enFolderPath) => {
        const folderPath = path.resolve(decodeURIComponent(enFolderPath));

        return await getDirectoryStructureSync(folderPath)
    });
    ipcMain.handle('check_folder_exist', async (event, enFilePath) => {
        const filePath = path.resolve(decodeURIComponent(enFilePath));
        const folderPath = path.dirname(filePath)

        return fileExists(folderPath)
    });

    ipcMain.handle(IPC_ACTIONS.PARSE_DOC_FILE, async (event, file) => {
        try {
            let buffer

            // 判断传入的是文件路径还是文件内容
            if (typeof file === 'string') {
                // 如果是文件路径，读取文件内容为 ArrayBuffer
                const fileBuffer = fs.readFileSync(file);
                buffer = fileBuffer;
            } else if (file instanceof ArrayBuffer) {
                // 如果是 ArrayBuffer，直接使用它
                buffer = Buffer.from(file);
            } else {
                throw new Error('Invalid file type');
            }

            // 使用 mammoth.js 解析文件
            const { value: htmlContent } = await mammoth.convertToHtml({ buffer });
            // 将图片转为 base64 URL 形式，并插入 HTML 中
            let htmlWithImages = htmlContent;
            // images.forEach(image => {
            //     const imgData = image.buffer; // 获取图片的二进制数据
            //     const base64Image = `data:${image.contentType};base64,${imgData.toString('base64')}`;
            //     const imgTag = `<img src="${base64Image}" alt="image" />`;

            //     // 插入到图片位置
            //     htmlWithImages = htmlWithImages.replace('<img src="image" />', imgTag);
            // });

            return htmlWithImages; // 返回完整的 HTML 内容
        } catch (error) {
            console.error('Error parsing file:', error);
            throw error;
        }
    });



};

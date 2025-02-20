import path from 'path';
import fs from 'fs';
import { dialog, ipcMain } from 'electron'
import { IPC_ACTIONS } from '../constants';
import { exec, spawn } from 'child_process';
import { deleteFile, fileExists, getDirectoryStructureSync, readDirectory } from '../utils/fileManager';
import mammoth from 'mammoth';
import { convertDocToImage } from '../utils/docUtils';
import { arrayBuffer } from 'stream/consumers';
import AppWindowManager from '../managers/AppWindowManager';
import { DOWNLOAD_DIR } from '../config/config';

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
            
            return htmlWithImages; // 返回完整的 HTML 内容
        } catch (error) {
            console.error('Error parsing file:', error);
            throw error;
        }
    });

    ipcMain.handle(IPC_ACTIONS.CONVERT_DOC_TO_IMAGE, async (event, file) => {
        try {
          const buffer = await  convertDocToImage(file)

          if (file instanceof ArrayBuffer) {
            return {
                arrayBuffer: buffer
            }
          } else {
            return {
                arrayBuffer: buffer,
                filePath: file.replace('.docx', '.png')
            }
          }

        } catch (error) {
          console.error('Error in convertToImage:', error);
          throw error;
        }
      });


      ipcMain.handle(IPC_ACTIONS.SAVE_BASE64_IMAGE, async (event, {imageData, enPath}:{imageData: string, enPath?: string}) => {
        let filePath
        // 如果传入了 filePath，直接使用；否则弹出保存文件对话框
        if (enPath) {
            filePath = decodeURIComponent(enPath)
        }
        if (!filePath) {
            const appWindowManager = AppWindowManager.getInstance();
            const win = appWindowManager.getWinInstance()
            const app = appWindowManager.getAppInstance()
          // 打开保存文件对话框
          const result = await dialog.showSaveDialog(win!, {
            title: 'Save Image',
            defaultPath: path.join(app!.getPath('desktop'), 'converted_image.png'),
            filters: [
              { name: 'Images', extensions: ['png', 'jpg', 'jpeg'] },
            ],
          });
      
          if (result.filePath) {
            filePath = result.filePath;  // 获取选择的文件路径
          }
        }
      
        if (filePath) {
          try {
            // 检查目录是否存在
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
              // 如果目录不存在，抛出错误
              throw new Error(`Directory does not exist: ${dir}`);
            }
      
            // Base64 字符串转为 Buffer，去掉前缀部分 (data:image/png;base64,)
            const base64Data = imageData.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');
      
            // 将 Buffer 写入到文件系统
            fs.writeFileSync(filePath, buffer);
      
            // 返回成功状态和文件路径
            return { success: true, filePath };
          } catch (error: any) {
            console.error('Error saving image:', error);
            return { success: false, message: error.message };
          }
        } else {
          // 如果没有选择路径，返回失败
          return { success: false, message: 'No file path provided.' }
        }
      });

      
      ipcMain.handle(IPC_ACTIONS.READ_JSON, async (event,filename) => {
        const filePath = path.join(DOWNLOAD_DIR, `${filename}.json`);
        try {
          const data = fs.readFileSync(filePath, 'utf-8');
          return JSON.parse(data); // 返回 JSON 数据
        } catch (error) {
          console.error('读取文件出错:', error);
          return null;
        }
      });

      ipcMain.handle(IPC_ACTIONS.SAVE_JSON, async (event, {data, filename}) => {
        const filePath = path.join(DOWNLOAD_DIR, `${filename}.json`);
        try {
          fs.writeFileSync(filePath, JSON.stringify(data, null, 2)); // 格式化保存 JSON 数据
          return filePath;
        } catch (error) {
          console.error('保存文件出错:', error);
          return null;
        }
      });
      ipcMain.handle(IPC_ACTIONS.DELETE_FILE, async (event, enPath) => {
        const filePath = path.resolve(decodeURIComponent(enPath));
        // const filePath = path.join(DOWNLOAD_DIR, `${filename}.json`);
        try {
          await deleteFile(filePath)
          return true;
        } catch (error) {
          console.error('delete文件出错:', error);
          return false;
        }
      });
      

}



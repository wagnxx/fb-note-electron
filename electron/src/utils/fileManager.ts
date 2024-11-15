import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';
import { FileError } from './FileError';

// 确保文件夹存在，如果不存在则创建
export const ensureDirectoryExists = async (dirPath: string): Promise<void> => {
    try {
        await fsPromises.mkdir(dirPath, { recursive: true });
        console.log(`Directory created or already exists: ${dirPath}`);
    } catch (err) {
        console.error(`Error creating directory: ${(err as Error).message}`);
        throw err;
    }
};

/**
 * 删除单个文件
 * @param filePath 文件路径
 */
export async function deleteFile(filePath: string): Promise<void> {
    try {
        // 确认文件是否存在
        await fileExists(filePath);

        // 删除文件
        await fs.promises.unlink(filePath);
        console.log(`File at ${filePath} has been deleted successfully.`);
    } catch (err: unknown) {
        // 类型检查确保是 FileError 类型
        if (err instanceof FileError) {
            if (err.code === 'ENOENT') {
                console.error(`File at ${filePath} does not exist.`);
            } else if (err.code === 'EACCES') {
                console.error(`Permission denied to delete file at ${filePath}.`);
            } else {
                console.error(`Error deleting file at ${filePath}:`, err.message);
            }
        } else if (err instanceof Error) {
            // 如果是普通的 Error 类型
            console.error('Unknown error during file deletion:', err.message);
        } else {
            console.error('An unexpected error occurred:', err);
        }
    }
}

/**
 * 批量删除文件
 * @param enPaths 文件路径数组
 */
export async function deleteFiles(enPaths: string[]): Promise<{ ok: boolean, message?: string }> {
    const deletePromises = enPaths.map(filePath => deleteFile(filePath));

    // 等待所有删除操作完成
    try {
        await Promise.all(deletePromises);
        console.log('All files have been deleted successfully.');
        return {
            ok: true
        }
    } catch (err: unknown) {
        let message = ''
        if (err instanceof FileError) {
            message = 'Error during batch file deletion:', err.message

        } else if (err instanceof Error) {
            message = 'Error during batch file deletion:', err.message
            console.error();
        } else {
            err = 'An unknown error occurred during batch file deletion:', err
        }
        console.error(message);
        return {
            ok: false,
            message
        }
    }
}

// 检查文件是否存在
export const fileExists = async (filePath: string): Promise<boolean> => {
    try {
        await fsPromises.access(filePath);
        return true;
    } catch {
        return false;
    }
};

// 读取文件内容
export const readFile = async (filePath: string, encoding: BufferEncoding = 'utf-8'): Promise<string> => {
    try {
        const data = await fsPromises.readFile(filePath, encoding);
        console.log(`File read successfully: ${filePath}`);
        return data;
    } catch (err) {
        console.error(`Error reading file: ${(err as Error).message}`);
        throw err;
    }
};

// 写入文件内容
export const writeFile = async (filePath: string, data: string | Buffer, encoding: BufferEncoding = 'utf-8'): Promise<void> => {
    try {
        await fsPromises.writeFile(filePath, data, { encoding });
        console.log(`File written successfully: ${filePath}`);
    } catch (err) {
        console.error(`Error writing file: ${(err as Error).message}`);
        throw err;
    }
};

// 追加数据到文件
export const appendToFile = async (filePath: string, data: string | Buffer, encoding: BufferEncoding = 'utf-8'): Promise<void> => {
    try {
        await fsPromises.appendFile(filePath, data, { encoding });
        console.log(`Data appended to file: ${filePath}`);
    } catch (err) {
        console.error(`Error appending to file: ${(err as Error).message}`);
        throw err;
    }
};

// 重命名文件
export const renameFile = async (oldPath: string, newPath: string): Promise<void> => {
    try {
        await fsPromises.rename(oldPath, newPath);
        console.log(`File renamed from ${oldPath} to ${newPath}`);
    } catch (err) {
        console.error(`Error renaming file: ${(err as Error).message}`);
        throw err;
    }
};

// 获取文件信息（大小，创建时间等）
export const getFileStats = async (filePath: string): Promise<fs.Stats> => {
    try {
        const stats = await fsPromises.stat(filePath);
        console.log(`File stats for: ${filePath}`);
        return stats;
    } catch (err) {
        console.error(`Error getting file stats: ${(err as Error).message}`);
        throw err;
    }
};

// 获取目录下的所有文件
export const readDirectory = async (dirPath: string): Promise<string[]> => {
    try {
        const files = await fsPromises.readdir(dirPath);
        console.log(`Files in directory: ${dirPath}`);
        return files;
    } catch (err) {
        console.error(`Error reading directory: ${(err as Error).message}`);
        throw err;
    }
};

// 删除目录及其内容
export const deleteDirectory = async (dirPath: string): Promise<void> => {
    try {
        const files = await fsPromises.readdir(dirPath);
        for (const file of files) {
            const currentPath = path.join(dirPath, file);
            const stats = await fsPromises.stat(currentPath);
            if (stats.isDirectory()) {
                await deleteDirectory(currentPath);  // 递归删除子目录
            } else {
                await fsPromises.unlink(currentPath);  // 删除文件
            }
        }
        await fsPromises.rmdir(dirPath);  // 删除空目录
        console.log(`Directory deleted: ${dirPath}`);
    } catch (err) {
        console.error(`Error deleting directory: ${(err as Error).message}`);
        throw err;
    }
};

// 复制文件
export const copyFile = async (srcPath: string, destPath: string): Promise<void> => {
    try {
        await fsPromises.copyFile(srcPath, destPath);
        console.log(`File copied from ${srcPath} to ${destPath}`);
    } catch (err) {
        console.error(`Error copying file: ${(err as Error).message}`);
        throw err;
    }
};

// 复制目录及其内容
export const copyDirectory = async (srcDir: string, destDir: string): Promise<void> => {
    try {
        await ensureDirectoryExists(destDir);
        const files = await fsPromises.readdir(srcDir);
        for (const file of files) {
            const srcPath = path.join(srcDir, file);
            const destPath = path.join(destDir, file);
            const stats = await fsPromises.stat(srcPath);
            if (stats.isDirectory()) {
                await copyDirectory(srcPath, destPath);  // 递归复制子目录
            } else {
                await copyFile(srcPath, destPath);  // 复制文件
            }
        }
        console.log(`Directory copied from ${srcDir} to ${destDir}`);
    } catch (err) {
        console.error(`Error copying directory: ${(err as Error).message}`);
        throw err;
    }
};

export const renameAndOverwrite = async (tempOutputPath: string, filePath: string) => {
    try {
        // 如果目标文件已经存在，删除它
        if (await fileExists(filePath)) {
            await fs.promises.unlink(filePath); // 删除目标文件
        }
        // 执行文件重命名
        await fs.promises.rename(tempOutputPath, filePath);
        console.log('File renamed and overwritten successfully.');
    } catch (error) {
        console.error('Error during renaming and overwriting:', error);
    }
};
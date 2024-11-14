import fs from 'fs';
import path from 'path';

// 自定义错误类型，扩展了 Error 类型
export class FileError extends Error {
    code?: string;

    constructor(message: string, code?: string) {
        super(message);
        this.name = 'FileError';
        this.code = code;
    }
}
// globals.d.ts
declare module 'fluent-ffmpeg';

// 在这里声明 express 模块
// global.d.ts

// 扩展 express 模块，确保类型正确
declare module 'express' {
    import { Request as ExRequest, Response as ExResponse, Express } from 'express';
    // 明确声明 express 是一个工厂函数
    const express: Express;

    // 扩展 Request 和 Response 类型
    export type Request = ExRequest;
    export type Response = ExResponse;

    // 默认导出 express 的工厂函数
    export = express;
}

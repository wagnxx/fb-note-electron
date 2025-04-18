// globals.d.ts
declare module 'fluent-ffmpeg';

// 在这里声明 express 模块
// global.d.ts

// 扩展 express 模块，确保类型正确
// express.d.ts
declare module 'express' {
    import { Request as ExRequest, Response as ExResponse, NextFunction as ExNextFunction, Express as ExExpress } from 'express';
  
    // express 是一个工厂函数，返回 Express 实例
    const express: ExExpress;
  
    // 扩展 Request 和 Response 类型
    export type Request = ExRequest;
    export type Response = ExResponse;
    export type NextFunction = ExNextFunction;
  
    // 自定义扩展 Request 和 Response 类型
    export interface Request {
      user?: any; // 扩展 Request，添加用户信息等自定义字段
    }
  
    export interface Response {
      sendJson?: (data: any) => Response; // 扩展 Response，添加自定义方法
    }
  
    // express.static 类型声明
    export interface StaticOptions {
      /**
       * Enable or disable serving dotfiles (files starting with a dot)
       * @default 'ignore'
       */
      dotfiles?: 'allow' | 'deny' | 'ignore';
  
      /**
       * Enable or disable ETag generation
       * @default 'true'
       */
      etag?: boolean;
  
      /**
       * Enable or disable the extension of file names
       * @default false
       */
      extensions?: string[];
  
      /**
       * Set the default index page (such as 'index.html') when no filename is provided
       * @default 'index.html'
       */
      index?: string | false;
  
      /**
       * Set the max-age of cached static files (in milliseconds or a string)
       * @default '0'
       */
      maxAge?: number | string;
  
      /**
       * Allow setting cache control headers for the static files
       * @default true
       */
      setHeaders?: (res: Response, path: string, stat: fs.Stats) => void;
    }
  
    /**
     * The express.static function type
     * @param root The root directory where the static files are stored
     * @param options The options for static file serving
     * @returns An Express handler function for serving static files
     */
    export function static(root: string, options?: StaticOptions): Handler;
  
    // 默认导出 express 工厂函数
    export = express;
  }
  
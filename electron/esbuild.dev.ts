import * as path from 'path'
import * as esbuild from 'esbuild'

esbuild
  .build({
    entryPoints: ['src/main.ts', 'src/preload.ts', 'src/main.entry.ts'], // 多个入口文件
    bundle: true, // 打包成一个文件
    // outfile: 'dist/main.bundle.js', // 输出路径
    splitting: false,
    outdir: 'dist',
    platform: 'node', // 运行平台是 Node.js
    target: 'esnext', // 目标平台是 ESNex
    alias: {
      '@shared': path.resolve(__dirname, '../shared'), // @shared -> src/shared
      '@': path.resolve(__dirname, 'src'), // @ -> src
    },
    resolveExtensions: ['.ts', '.tsx', '.js', '.json'], // 解析这些扩展名
    external: ['@dabh/diagnostics', '@colors/colors', '@xmldom/xmldom', 'electron'], // 外部依赖
  })
  .catch(() => process.exit(1))

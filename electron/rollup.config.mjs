import path from 'path';
import json from '@rollup/plugin-json';
import alias from '@rollup/plugin-alias';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
// import { nodeBuiltins } from 'rollup-plugin-node-builtins';
import nodeGlobals from 'rollup-plugin-node-globals';
import terser from '@rollup/plugin-terser';



const isDev = process.env.NODE_ENV !== 'production';
const __dirname = path.dirname(new URL(import.meta.url).pathname);

export default {
  input: 'src/main.ts',
  output: {
    dir: 'dist',
    format: 'cjs',
    sourcemap: isDev,
    preserveModules: isDev,
    exports: 'auto',
    ...(isDev
      ? {}
      : {
          entryFileNames: 'main.js',
        }),
  },
  plugins: [
    json(),
    alias({
      entries: [
        { find: '@', replacement: path.resolve(__dirname, 'src') },
      ],
    }),
    nodeResolve({
      extensions: ['.js', '.ts'],
      preferBuiltins: true,
    }),
    commonjs(),
    typescript({
      tsconfig: path.resolve(__dirname, 'tsconfig.json'),
      useTsconfigDeclarationDir: true,
    }),
    // nodeBuiltins(),
    nodeGlobals(),
    ...(isDev ? [] : [terser()]),
  ],
  external: (id) => /node_modules/.test(id), // 所有node_modules 模块都不被打包，production 下 手动copy deps
  // 生产环境：打包所有依赖
  watch: isDev
    ? {
        clearScreen: false,
        include: ['src/**', '../shared/ipcActions.js'],
        exclude: 'node_modules/**',
      }
    : null,
};

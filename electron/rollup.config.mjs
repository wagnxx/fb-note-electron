// @ts-nocheck
import path from 'path';
import json from '@rollup/plugin-json';
import alias from '@rollup/plugin-alias';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import nodeGlobals from 'rollup-plugin-node-globals';
import del from 'rollup-plugin-delete';
import terser from '@rollup/plugin-terser';

import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pkg = require('./package.json');
const { dependencies } = pkg;

const isDev = process.env.NODE_ENV !== 'production';
const __dirname = path.dirname(new URL(import.meta.url).pathname);

// 外部化的模块（不打包进来）
const externalDeps = [
  'electron',
  // path.resolve(__dirname, '../shared/ipcActions.ts')  // 👈 明确 external ipcActions
];

export default [
  // main.ts 打包
  {
    input: 'src/main.ts',
    output: {
      dir: 'dist',
      format: 'cjs',
      sourcemap: false,
      preserveModules: isDev,
      exports: 'auto',
      ...(isDev ? {

      } : { entryFileNames: 'main.js' }),
    },
    plugins: [
      // del({ targets: 'dist/*' }),
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
      nodeGlobals(),
      ...(isDev ? [] : [terser()]),
    ],
    external: (id) => {
      // if (externalDeps.includes(id)) return true;
      if (/node_modules/.test(id)) return true;
      return false;
    },
    watch: isDev
      ? {
          clearScreen: false,
          include: ['src/**', '../shared/**'],
          exclude: 'node_modules/**',
        }
      : null,
  },

  // preload.ts 打包
  {
    input: 'src/preload.ts',
    output: { file: 'dist/preload.js', format: 'cjs' },
    plugins: [
      nodeResolve({
        extensions: ['.js', '.ts'],
        preferBuiltins: true,
      }),
      typescript(),
      commonjs(),
    ],
    external: externalDeps,
    watch: isDev
    ? {
        clearScreen: false,
        include: ['src/preload.ts'],
        exclude: 'node_modules/**',
      }
    : null,
  },
  // preload.ts 打包
  {
    input: 'src/main.entry.ts',
    output: { file: 'dist/main.entry.js', format: 'cjs' },
    plugins: [
      nodeResolve({
        extensions: ['.js', '.ts'],
        preferBuiltins: true,
      }),
      typescript(),
      commonjs(),
    ],
  },
];

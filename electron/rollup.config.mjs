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

const mode = process.env.NODE_ENV || 'development';
const isDev = mode === 'development';
const isDebug = mode === 'debug';
const isProd = mode === 'production';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const externalDeps = ['electron'];

const preserveModules = isDev || isDebug;

export default [
  // main.ts 打包
  {
    input: 'src/main.ts',
    output: {
      dir: 'dist',
      format: 'cjs',
      sourcemap: isDebug || isProd,
      preserveModules,
      exports: 'auto',
      ...(preserveModules ? {} : { entryFileNames: 'main.js' }),
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
      ...(isProd ? [terser()] : []),
    ],
    external: (id) => {
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

  // main.entry.ts 打包
  {
    input: 'src/main.entry.ts',
    output: { file: 'dist/main.entry.js', format: 'cjs' },
    plugins: [
      nodeResolve({
        extensions: ['.js', '.ts'],
        preferBuiltins: true,
        sourcemap: true,
      }),
      typescript(),
      commonjs(),
    ],
  },
];

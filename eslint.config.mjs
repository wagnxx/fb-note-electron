// electron/eslint.config.js
import globals from 'globals';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import unusedImport from 'eslint-plugin-unused-imports';
import { electronRules } from './eslint.rules.mjs';



export default [
  {
    ignores: ['electron/release/**', 'web-app', ],
  },
  {
    files: [
      'electron/src/**/*.ts',
       'shared/**/*.ts'
    ],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './electron/tsconfig.json',
      },
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      "unused-imports": unusedImport, // 注册 unused imports 插件
      prettier: prettierPlugin,
    },
    rules: {
      ...electronRules,
      ...prettierConfig.rules
    },
  },
];

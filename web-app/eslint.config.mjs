import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser'; // 引入 TypeScript 解析器
import pluginReact from 'eslint-plugin-react';
import unusedImport from 'eslint-plugin-unused-imports';
import pluginPrettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import { webAppRules } from '../eslint.rules.mjs';



export  default [
  // Global language options for the entire project
  { 
    languageOptions: { 
      globals: {
        ...globals.browser,
        module: 'readonly',
        JSX: 'readonly',
      },
      parserOptions: {
        ecmaVersion: 2020,  // 支持 ES2020 语法
        sourceType: 'module',  // 使用 ECMAScript modules
      },
    } 
  },
  
  // JavaScript basic recommendations
  pluginJs.configs.recommended,

  // TypeScript-specific recommendations
  {
    files: ["**/*.ts", "**/*.tsx"],
    ignores: ["**/*.config.js", "**/*.test.*", "**/*.js"],
    languageOptions: {
      parser: tsParser,  // 设置 TypeScript 解析器
      parserOptions: {
        project: './tsconfig.json',  // 指定 TypeScript 配置文件
      },
    },
    plugins: {
      "@typescript-eslint": tseslint, // 手动注册 TypeScript ESLint 插件
      "unused-imports": unusedImport, // 注册 unused imports 插件
      "prettier": pluginPrettier, // 注册 Prettier 插件
      "react": pluginReact,
      "react-hooks": reactHooks, // 注册 react-hooks 插件
    },
    settings: {
      react: {
        version: 'detect', // 自动检测 React 版本
      },
    },
    rules: {
      ...webAppRules,
      ...prettierConfig.rules
    },
  }
];

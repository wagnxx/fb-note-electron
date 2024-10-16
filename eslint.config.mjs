import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser'; // 引入 TypeScript 解析器
import pluginReact from 'eslint-plugin-react';
import unusedImport from 'eslint-plugin-unused-imports';
import pluginPrettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
export default [
  // Global language options for the entire project
  { 
    languageOptions: { 
      globals: {

        ...globals.browser,
        module: 'readonly',
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
    ignores: ["**/*.config.js", "**/*.test.*"],
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
    },
    rules: {
      'prettier/prettier': 'error',

      // 检测并删除未使用的导入
      'unused-imports/no-unused-imports-ts': 'warn',
      'unused-imports/no-unused-vars-ts': [
        'warn',
        {
          varsIgnorePattern: '^_', // 确保这里没有设置成 "^.*$" 或类似的模式
          argsIgnorePattern: '^_',
        },
      ],
  
      // 关闭默认的未使用变量检测规则
      '@typescript-eslint/no-unused-vars': 'off',
      'no-unused-vars': 'off',
      // 其他 ESLint 规则
      // quotes: ['error', 'single'], // 使用单引号
  
      indent: 'off', // 不使用 indent 规则
      'no-tabs': 'off',
      'keyword-spacing': ['error', { before: true, after: true }], // 冒号后面必须有一个空格
      // 'space-before-function-paren': ['error', 'always'], // 函数名与括号之间有一个空格
      'space-before-function-paren': 0,
      'object-curly-spacing': ['error', 'always'],
      'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1 }], // 最多有2个空行，文件末尾不能有空行
      'react-native/no-inline-styles': 'off',
      'object-property-newline': 'off',
      ...prettierConfig.rules
    },
  },

  // React-specific recommendations
  {
    files: ["**/*.jsx", "**/*.tsx"],
    plugins: {
      "react": pluginReact,
    },
    settings: {
      react: {
        version: "detect",  // 自动检测 React 版本
      },
    },
    rules: {
      // 在此处可以添加 React 相关的自定义规则
    },
  }
];

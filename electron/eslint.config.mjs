// electron/eslint.config.js
import globals from 'globals';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import unusedImport from 'eslint-plugin-unused-imports';

const commonRules = {
  'prettier/prettier': 'error',
  '@typescript-eslint/no-unused-vars': 'warn',
  'no-console': 'off',
  'no-debugger': 'off',
  'semi': ['error', 'never'],
  // 检测并删除未使用的导入
  // 'unused-imports/no-unused-imports-ts': 'warn',
  // 'unused-imports/no-unused-vars-ts': [
  //   'warn',
  //   {
  //     varsIgnorePattern: '^_', // 确保这里没有设置成 "^.*$" 或类似的模式
  //     argsIgnorePattern: '^_',
  //   },
  // ],

  // 关闭默认的未使用变量检测规则
  'no-unused-vars': 'off',


  // 其他 ESLint 规则
  indent: 'off', // 不使用 indent 规则
  'no-tabs': 'off',
  'keyword-spacing': ['error', { before: true, after: true }], // 冒号后面必须有一个空格
  'space-before-function-paren': 0,
  'object-curly-spacing': ['error', 'always'],
  'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1 }], // 最多有2个空行，文件末尾不能有空行

  'object-property-newline': 'off',
  ...prettierConfig.rules
} 

export default [
  {
    ignores: ['release/**'],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig.json',
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
    rules: commonRules,
  },
];

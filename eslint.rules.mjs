// eslint.config.mjs

// ✅ 通用规则（共享给所有项目：prettier、格式相关、空行等）
export const commonRules = {
    'prettier/prettier': ['error', {
      singleQuote: true,
      semi: false,
      trailingComma: 'all',
      arrowParens: 'avoid',
      bracketSpacing: true,
      jsxBracketSameLine: false,
      endOfLine: 'auto',
      spaceBeforeFunctionParen: false, //eslint-config-prettier off
      tabWidth: 2,
      useTabs: false,
      printWidth: 120,
    }], // 需要 "prettier": "^3.x"
    indent: 'off',
    'no-tabs': 'off',
    'keyword-spacing': ['error', { before: true, after: true }],
    'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1 }],
    'object-property-newline': 'off',
  }
  
  // ✅ electron 专属规则（eslint v9 + 新版插件）
  export const electronRules = {
    ...commonRules,
    '@typescript-eslint/no-unused-vars': 'off', // 使用 unused-imports 替代
    'no-console': 'off',
    'no-debugger': 'off',
    semi: ['error', 'never'],
    'unused-imports/no-unused-imports': 'warn', // ⚠️ 来自 "eslint-plugin-unused-imports": "^4.1.4"
    'unused-imports/no-unused-vars': [
      'warn',
      {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern: '^_',
      },
    ],
    'no-unused-vars': 'off',
    'object-curly-spacing': 'off', // prettier 接管
    'space-in-parens': 'off',
  }
  
  // ✅ web-app 专属规则（eslint v8 + React 项目）
  export const webAppRules = {
    ...commonRules,
    '@typescript-eslint/no-unused-vars': 'off',
    'no-unused-vars': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'react/jsx-uses-react': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'space-before-function-paren': 0,
    'object-curly-spacing': ['error', 'always'],
    'react-native/no-inline-styles': 'off',
  
    // ⚠️ 来自 "eslint-plugin-unused-imports": "^3.2.0"
    'unused-imports/no-unused-imports-ts': 'warn',
    'unused-imports/no-unused-vars-ts': [
      'warn',
      {
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_',
      },
    ],
  }
  
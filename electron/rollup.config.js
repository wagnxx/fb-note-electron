import typescript from 'rollup-plugin-typescript2';  // 使用 ESM 方式导入插件

export default {
  input: 'src/main.ts',  // TypeScript 入口文件
  output: [
    {
      file: 'dist/main.js',  // 输出 CommonJS 格式的 JS 文件
      format: 'cjs',          // 设置输出格式为 CommonJS
      sourcemap: true         // 启用 sourcemap 以便调试
    }
  ],
  plugins: [
    typescript({ 
      tsconfig: './tsconfig.json'  // 使用 tsconfig 配置文件
    })
  ]
};

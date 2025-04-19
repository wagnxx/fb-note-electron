// rollup.config.cjs
const path = require('path');
const alias = require('@rollup/plugin-alias');
const nodeResolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const typescript = require('rollup-plugin-typescript2');

module.exports = {
  input: 'src/main.ts',
  output: {
    dir: 'dist',
    format: 'cjs',
    sourcemap: true,
    preserveModules: true,
    exports: 'auto'
  },
  plugins: [
    alias({
      entries: [
        { find: '@', replacement: path.resolve(__dirname, 'src') },
      ]
    }),
    nodeResolve({
      extensions: ['.js', '.ts'],
      preferBuiltins: true
    }),
    commonjs(),
    typescript({
      tsconfig: path.resolve(__dirname, 'tsconfig.json'),
      useTsconfigDeclarationDir: true
    })
  ],
  external: ['electron', 'fs', 'path', 'os']
};

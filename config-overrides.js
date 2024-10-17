/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
// eslint-disable-next-line no-undef
const webpack = require('webpack');

module.exports = {
  webpack: (config, env) => {
    // 添加 fallback 配置
    config.resolve.fallback = {
      fs: false, // 禁用 fs
      path: require.resolve('path-browserify'), // 使用 path-browserify
      // 其他模块的 polyfill 配置
      // stream: require.resolve('stream-browserify'),
    };
    config.plugins = [
        ...config.plugins,
        new webpack.DefinePlugin({
            'process.env.ELECTRON': JSON.stringify(process.env.ELECTRON || 'false'),
          }),
    ]
    return config;
  },
};

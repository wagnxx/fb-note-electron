/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
// eslint-disable-next-line no-undef
const webpack = require('webpack');
const path = require('path');


module.exports = {
  webpack: (config, env) => {

    // config.output.publicPath =  process.env.REACT_APP_ENV === 'production' ? './' : '/';
    config.output.publicPath =  process.env.REACT_APP_ENV === 'production' ? '/ulogi' : '/ulogi';
    // 添加 fallback 配置
    config.resolve.fallback = {
      fs: false, // 禁用 fs
      path: require.resolve('path-browserify'), // 使用 path-browserify
      // 其他模块的 polyfill 配置
      // stream: require.resolve('stream-browserify'),
    };
    
    config.resolve.alias = {
     '@': path.resolve(__dirname, 'src/'),
     '@components': path.resolve(__dirname, 'src/components/'),
     '@utils': path.resolve(__dirname, 'src/utils/'),
     '@hooks': path.resolve(__dirname, 'src/hooks/'),
     '@shared': path.resolve(__dirname, '../shared/')
    }

    config.resolve.extensions = ['.js', '.jsx', '.ts', '.tsx', '.json']

    config.plugins = [
        ...config.plugins,
        new webpack.DefinePlugin({
            'process.env.ELECTRON': JSON.stringify(process.env.ELECTRON || 'false'),
          }),
    ]


    config.watchOptions = {
      ignored: /node_modules/,
    };

    const oneOfRule = config.module.rules.find(rule => Array.isArray(rule.oneOf));
    if (oneOfRule) {
      oneOfRule.oneOf.forEach(rule => {
        if (rule.include && typeof rule.include === 'string' && rule.include.includes('src')) {
          rule.include = [rule.include, path.resolve(__dirname, '../shared')];
        }
      });
    }

    


    return config;
  },
};

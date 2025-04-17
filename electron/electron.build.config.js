const path = require('path');
require('dotenv').config(); // 确保环境变量被加载

const SUPPORT_DIR = process.env.SUPPORT_DIR || 'support'; // 使用相对路径

module.exports = {
  productName: 'ULogi', // Ulogi 有点像UIogi，l大写突出U，Log，i
  appId: 'fb.note.electron',
  asar: true,
  // asar: false,
  directories: {
    output: "release" // 指定打包输出目录
  },
  files: [
    "dist/**/*",
    'node_modules/**', // 需要测试 该选文件夹必选
    ".env",
  ],
  extraResources: [
    {
      from: 'support',
      to: path.join(SUPPORT_DIR),
    },
    {
      from: 'preload.js',
      to: path.join(SUPPORT_DIR, 'preload.js'),
    },
    {
      from: 'build-service',
      to: path.join(SUPPORT_DIR, 'build-service'),
    },
    {
      from: 'logs',
      to: path.join(SUPPORT_DIR, 'logs'),
    },
    {
      from: 'temps',
      to: path.join(SUPPORT_DIR, 'temps'),
    },
    {
      from: '../web-app/build',
      to: 'web-app/build',
    },
    {
      from: '../shared',
      to: path.join('shared'),
    },
  ],
  mac: {
    target: ['dmg'],
    icon: 'assets/icons/ulogi_mac.icns',
  },
  win: {
    target: ['nsis'],
    icon: 'assets/icons/ulogi_win.ico',
  },
};

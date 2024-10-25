const path = require('path');
require('dotenv').config(); // 确保环境变量被加载

const SUPPORT_DIR = process.env.SUPPORT_DIR || 'support'; // 使用相对路径

module.exports = {
  productName: 'fb-note-electron',
  appId: 'fb.note.electron',
  asar: true,
  directories: {
    output: "release" // 指定打包输出目录
  },
  files: [
    "dist/**/*",
    'node_modules/**', // 需要测试 该选文件夹必选
    ".env"
  ],
  extraResources: [
    {
      from: 'preload.js',
      to: path.join(SUPPORT_DIR, 'preload', 'preload.js'),
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
  ],
  mac: {
    target: ['dmg'],
    icon: 'assets/icons/icon.icns',
  },
  win: {
    target: ['nsis'],
    icon: 'assets/icons/icon.ico',
  },
};

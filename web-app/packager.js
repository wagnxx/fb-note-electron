/* eslint-disable no-undef */
const packager = require('electron-packager');
const path = require('path');

/**
 * 
# 打包 Windows 版本
npm run pack -- win32 x64

# 打包 macOS 版本
npm run pack -- darwin x64

# 打包 Linux 版本
npm run pack -- linux x64
 * 
 * 
*/

// 从命令行参数中获取平台和架构
const platform = process.argv[2] || process.platform; // 默认使用当前平台
const arch = process.argv[3] || process.arch; // 默认使用当前架构

let iconPath;

if (platform === 'win32') {
  iconPath = path.join(__dirname, 'electron/assets/icons/icon.ico');
} else if (platform === 'darwin') {
  iconPath = path.join(__dirname, 'electron/assets/icons/icon-mac.icns');
} else if (platform === 'linux') {
  iconPath = path.join(__dirname, 'electron/assets/icons/icon-linux.png');
}

packager({
  dir: '.',
  name: 'MyApp',
  platform: platform,
  arch: arch,
  out: 'release',
  overwrite: true,
  prune: true,
  asar: true,
  icon: iconPath, // 根据平台设置图标路径
}).then(appPaths => {
  console.log('Packaging done:', appPaths);
}).catch(error => {
  console.error('Error packaging:', error);
});

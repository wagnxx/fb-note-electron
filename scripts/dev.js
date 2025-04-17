const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const WEB_PORT = 3000;
const WEB_DIR = path.resolve(__dirname, '../../web-app');
const ELECTRON_DIR = path.resolve(__dirname, '..');

function checkWebStarted(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}`, () => resolve(true));
    req.on('error', () => resolve(false));
    req.end();
  });
}

function runCommand(cmd, args, cwd, name) {
  const child = spawn(cmd, args, { cwd, stdio: 'inherit', shell: true });
  child.on('exit', (code) => {
    if (code !== 0) {
      console.error(`${name} exited with code ${code}`);
    }
  });
  return child;
}

(async () => {
  const isWebRunning = await checkWebStarted(WEB_PORT);

  if (!isWebRunning) {
    console.log(`🚀 Starting web-app on port ${WEB_PORT}...`);
    runCommand('npm', ['start'], WEB_DIR, 'web-app');
    // 等待开发服务启动（可根据实际调整时间或轮询）
    await new Promise(resolve => setTimeout(resolve, 5000));
  } else {
    console.log(`✅ web-app already running at http://localhost:${WEB_PORT}`);
  }

  console.log(`🧪 Launching Electron app...`);
  runCommand('npm', ['dev:start'], ELECTRON_DIR, 'electron');
})();

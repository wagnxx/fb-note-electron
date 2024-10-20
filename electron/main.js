/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { SERVICE_NAMES, IPC_ACTIONS } = require('./constants');
const { createLogger, format, transports } = require('winston');


const isDev = process.env.ELECTRON_START_URL !== undefined;
// const isDev = false
const platform = process.platform

const SOCKS_RELATIVE_PATH = isDev 
  ? 'socks-server.js' 
  : platform === 'win32' 
    ? 'build-service/socks-server-win.exe' 
    : platform === 'darwin' 
      ? 'build-service/socks-server-macos' 
      : 'build-service/socks-server-linux';

const LOG_FILE_PATH =  path.join(__dirname, 'logs/error.log')
const pidFile = path.join(__dirname, 'temps', 'socks_service.pid');
const infoFile = path.join(__dirname, 'temps', 'socks_service_info.json');
// 创建日志记录器
const logger = createLogger({
  level: 'error',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.File({ filename: LOG_FILE_PATH })
  ],
});

let socksProcess;


function createWindow() {
  let preloadPath = isDev ?  path.join(__dirname, 'preload.js') :   path.join(__dirname, '../preload.js')

  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false, // 确保安全性
      contextIsolation: true,
    },
  });

  // 判断是否在开发环境
 

  if (isDev) {
    // 开发环境，加载 React 开发服务器
    win.loadURL(process.env.ELECTRON_START_URL);
  } else {
    // 生产环境，加载打包后的 React 应用
    win.loadFile(path.join(__dirname, '../web-app/build/index.html'));
  }
  
}

app.whenReady().then(() => {
  createWindow();

  // 启动 SOCKS 服务
  ipcMain.on(IPC_ACTIONS.START_SOCKS_SERVICE, (event, { payload : {address, port} }) => {

    try {
      if (!socksProcess) {
        console.log("address, port", address, port);
        
        if (isDev) {

          socksProcess = spawn('node', [path.join(__dirname,  SOCKS_RELATIVE_PATH), address, port]);
        } else {
          socksProcess = spawn(path.join(__dirname, SOCKS_RELATIVE_PATH), [address, port], {
            // stdio: 'inherit', // 继承父进程的输入输出
          });
        }
        // 将子进程的输出通过 IPC 发送到渲染进程
        socksProcess.stdout.on('data', (data) => {
          const output = data.toString()
          console.log(`SOCKS 服务输出: ${output}`);
          event.sender.send(IPC_ACTIONS.SOCKS_SERVICE_OUTPUT, output);

          try {
            const parsedData = JSON.parse(output)
            console.log('parsedData:::',parsedData);
            if (parsedData?.type === 'write_pid_to_temp') {
              const {host, port, pid } = parsedData
              fs.writeFileSync(pidFile, pid);
              fs.writeFileSync(infoFile, JSON.stringify({ host, port }));
            }
            
          } catch (error) {
            console.log('parse output error::', error); 
          }
        });
  
        socksProcess.stderr.on('data', (data) => {
          console.error(`SOCKS 服务错误: ${data}`);
          logger.error(data.toString())
          event.sender.send(IPC_ACTIONS.SOCKS_SERVICE_ERROR, data.toString());
        });
  
        socksProcess.on('close', (code) => {
          console.log(`SOCKS 服务已停止，退出码: ${code}`);
          socksProcess = null;
          event.sender.send(IPC_ACTIONS.SOCKS_SERVICE_STOPPED, `SOCKS 服务已停止，退出码: ${code}`);
        });
  
        socksProcess.on('message', (msg) => {
          if (msg.type === IPC_ACTIONS.START_SOCKS_SERVICE) {
            event.sender.send(IPC_ACTIONS.START_SOCKS_SERVICE, msg.message);
          } else if (msg.type === IPC_ACTIONS.SOCKS_SERVICE_ERROR) {
            event.sender.send(IPC_ACTIONS.SOCKS_SERVICE_ERROR, msg.message);
          }
        });
  
        console.log('SOCKS 服务已启动');
      } else {
        console.log('SOCKS 服务已经在运行');
        event.sender.send(IPC_ACTIONS.SOCKS_SERVICE_OUTPUT, 'SOCKS 服务已经在运行');
      }
    } catch (error) {
     logger.error(error);
     event.sender.send(IPC_ACTIONS.SOCKS_SERVICE_ERROR, '启动服务时发生错误')
    }
    

  });

  // 监听停止服务的请求
  ipcMain.on(IPC_ACTIONS.STOP_SOCKS_SERVICE, (event, {action = null }) => {
    if (socksProcess) {
      socksProcess.kill();
      socksProcess = null;
      console.log('SOCKS 服务已停止');
      event.sender.send('socks-service-stopped', 'SOCKS 服务已停止', action);
    } else {
      console.log('SOCKS 服务未运行');
      event.sender.send(IPC_ACTIONS.SOCKS_SERVICE_OUTPUT, 'SOCKS 服务未运行', action);
    }
  });

  ipcMain.handle(IPC_ACTIONS.GET_SOCKS_SERVICE_INFO, async () => {
    return await getSocksServiceInfo();
  });
  ipcMain.handle(IPC_ACTIONS.CHECK_SOCKS_SERVICE, async () => {
    const serviceName = `node ${SERVICE_NAMES.socks5}`;
    return await checkService(serviceName);
  });
  ipcMain.handle(IPC_ACTIONS.GET_LOGS, async () => {
    return await getLogs();
  });



  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
  if (socksProcess) {
    socksProcess.kill();
  }
});


 // 捕获未处理的异常
process.on('uncaughtException', (error) => {
  logger.error(error);
});

// 捕获未处理的拒绝
process.on('unhandledRejection', (error) => {
  logger.error(error);
});


/**
 * 检查指定服务是否正在运行
 * @param {string} serviceName - 
 * @returns {Promise<boolean>} - 返回一个 Promise，表示服务是否在运行
 */
function checkService(serviceName) {
  return new Promise((resolve, reject) => {
    exec(`pgrep -f ${serviceName}`, (error, stdout) => {
      if (error) {
        return reject(error);
      }
      const isRunning = stdout.trim() !== '';
      resolve(isRunning);
    });
  });
}

function getLogs() {
  try {
    const data = fs.readFileSync(LOG_FILE_PATH, 'utf-8');
    const lines = data.split('\n').filter(line => line.trim());
    const logs = lines.map(line => {
      try {
        return JSON.parse(line);
      } catch (parseErr) {
        return { error: `无法解析日志行: ${parseErr.message}`, line };
      }
    });
    return { logs };
  } catch (err) {
    return { error: err.message };
  }
}

function getSocksServiceInfo() {
  let data = {
    host: '',
    port: '',
    isRunning: false,
    message: ''
  };

  try {
    let jsonData = fs.readFileSync(infoFile, 'utf-8');
    jsonData = JSON.parse(jsonData);
    data.host = jsonData.host;
    data.port = jsonData.port;
  } catch (error) {
    logger.error(`Failed to read or parse ${infoFile}: ${error.message}`);
  }

  if (fs.existsSync(pidFile)) {
    const pid = parseInt(fs.readFileSync(pidFile, 'utf-8'), 10);
    
    try {
      process.kill(pid, 0); // 检查进程是否仍然存在
      data.isRunning = true;
    } catch (err) {
      const message = `Process with PID ${pid} is not running.`;
      logger.error(message);
      data.isRunning = false;
      data.message = message;
    }
  } else {
    data.message = 'No PID file found.';
  }
  
  return data;
}

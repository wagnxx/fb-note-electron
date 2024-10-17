/* eslint-disable no-undef */
const { Socks5Server } = require('socks5-server');
const path = require('path')
const fs = require('fs')

const startSocksServer = (host, port, callback) => {
  const pidFile = path.join(__dirname, 'socks_service.pid');
  const infoFile = path.join(__dirname, 'socks_service_info.json');

  // 创建并写入 PID 文件
  fs.writeFileSync(pidFile, process.pid.toString());
  const server = new Socks5Server({ host, port });

  server.listen(port, host, () => {
    callback(null, `SOCKS5 Server running at ${host}:${port}`); // 成功回调
    fs.writeFileSync(infoFile, JSON.stringify({ host, port }));
    // 发送成功信息到主进程
    // process.send({ type: 'socks-service-started', message: `SOCKS5 Server running at ${host}:${port}` });
  });

  server.on('error', (err) => {
    console.error(`Error: ${err.message}`);
    callback(err); // 失败回调
    // 发送错误信息到主进程
    process.send({ type: 'socks-service-error', message: err.message });
  });

  return server;
};

// 从命令行参数获取 host 和 port
const args = process.argv.slice(2);
console.log('args:::', args);
const [host, port] = args;

if (!host || !port) {
  console.error('Host and port must be specified.');
  process.exit(1);
}

// 启动 SOCKS5 服务
startSocksServer(host, parseInt(port), (error, successMessage) => {
  if (error) {
    console.error(error);
    process.exit(1);
  } else {
    console.log(successMessage);
  }
});

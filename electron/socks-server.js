/* eslint-disable no-undef */
const { Socks5Server,AUTH_METHODS } = require('socks5-server');
const path = require('path')
const fs = require('fs')

const startSocksServer = (host, port, callback) => {
  const server = new Socks5Server({ timeout: 300000 });
  server.registerAuth(AUTH_METHODS.NOAUTH);
  // 处理连接
  server.on('connection', (connection) => {
    console.log('Client connected:', connection.remoteAddress);
  });

  server.listen(port, host, () => {
    callback(null, `SOCKS5 Server running at ${host}:${port}`); // 成功回调
  });

  server.on('error', (err) => {
    console.error(`Error: ${err.message}`);
    callback(err); // 失败回调
  });

  return server;
};

// 从命令行参数获取 host 和 port
const args = process.argv.slice(2);
// console.log('args:::', args);
const [host, port] = args;

if (!host || !port) {
  console.error('Host and port must be specified.');
  process.exit(1);
}

// 启动 SOCKS5 服务
startSocksServer(host, parseInt(port), (error, successMessage) => {
  if (error) {
    console.error(error);
    process.send({ type: 'socks-service-error', message: err.message });
    process.exit(1);
  } else {
    console.log(successMessage);
    console.log(JSON.stringify({
      type: 'write_pid_to_temp',
      pid:process.pid.toString(),
      host,
      port
    }))
  }
});

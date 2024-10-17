/* eslint-disable no-undef */
const { Socks5Server } = require('socks5-server');

const startSocksServer = (host, port, callback) => {
  const server = new Socks5Server({ host, port });

  server.listen(port, host, () => {
    console.log(`SOCKS5 Server running at ${host}:${port}`);
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
    // 将成功信息发送到 Electron 渲染进程
    const { ipcRenderer } = require('electron');
    ipcRenderer.send('socks-service-started', successMessage);
  }
});

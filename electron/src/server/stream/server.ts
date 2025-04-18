import type { Server } from 'http';

let currentServer: Server | null = null;
const PORT = 4000;

 async function restart(): Promise<Server> {
  // 尝试关闭旧服务（如果有）
  if (currentServer) {
    console.log('🛑 Closing previous video stream server...');
    await new Promise<void>((resolve, reject) => {
      currentServer!.close(err => {
        if (err) {
          console.error('❌ Failed to close server:', err);
          reject(err);
        } else {
          console.log('✅ Previous server closed.');
          resolve();
        }
      });
    });
    currentServer = null;
  }

  // 动态导入最新模块
  try {
    const mod = await import(`./expressApp`);
    const app = mod.createApp();

    const server = app.listen(PORT, () => {
      console.log(`🚀 Video stream server running at http://localhost:${PORT}`);
    });

    currentServer = server;
    return server;
  } catch (err) {
    console.error('❌ Failed to start new video stream server:', err);
    throw err;
  }
}

export default {
  restart
}
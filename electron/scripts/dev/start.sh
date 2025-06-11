#!/bin/bash
# npm run build:tsc > /dev/null 2>&1 || (echo 'Error in build:tsc. See details below:' && npm run build:tsc 2>&1 | grep 'Error') && npm run dev:ele



# 彩色输出函数
info() {
  echo -e "\033[1;34m[INFO]\033[0m $1"
}

success() {
  echo -e "\033[1;32m[SUCCESS]\033[0m $1"
}

error() {
  echo -e "\033[1;31m[ERROR]\033[0m $1"
}

# 开始构建 TypeScript
info "Checking TypeScript build..."

# 运行 TypeScript 编译并开启 -w 模式来监听文件变化
# npm run dev:tsc > /dev/null 2>&1 &  # 将 tsc -w 进程放到后台
# npm run dev:tsc > /dev/null & 
npm run dev:tsc & 
TSC_PID=$!  # 获取 tsc -w 进程的 PID

# 等待最多 20 秒直到 dist 目录下出现 main.js 文件
max_wait_time=20
wait_time=0

# 检查 dist/main.js 是否存在
while [ ! -f "dist/main.entry.js" ] && [ $wait_time -lt $max_wait_time ]; do
  sleep 2
  wait_time=$((wait_time + 2))
done

# 如果在最大等待时间内找到了 main.js 文件
if [ -f "dist/main.entry.js" ]; then
  success "TypeScript build succeeded. Found main.js in dist."
  
  # 启动 Electron
  info "Starting Electron..."
  npm run dev:ele 
  ELEC_PID=$!  # 获取 Electron 进程的 PID

  # 在退出时杀掉后台的 tsc 和 electron 进程
  trap "kill $TSC_PID " EXIT

else
  error "TypeScript build failed or main.js not found in dist after waiting for 20 seconds."
  # 可选：可以输出错误日志或者进行其他处理
  # 退出脚本时杀死 tsc 进程
  kill $TSC_PID
  exit 1
fi

info "Script finished. Electron is running, and TypeScript is being watched."

# 确保在脚本结束时杀掉 tsc 进程
trap "kill $TSC_PID " EXIT

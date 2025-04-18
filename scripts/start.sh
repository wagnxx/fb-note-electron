#!/bin/bash

WEB_PORT=3000
WEB_DIR="web-app"
ELECTRON_DIR="electron"

is_port_open() {
  nc -z localhost $1 >/dev/null 2>&1
  return $?
}

start_web() {
  echo "🚀 Starting web-app..."
  cd "$WEB_DIR"
  pnpm run dev:start &
  WEB_PID=$!
  cd - >/dev/null
}

start_electron() {
  echo "⚡ Launching Electron app..."
  cd "$ELECTRON_DIR"
  npm run dev:start
}

# 主逻辑
if is_port_open $WEB_PORT; then
  echo "✅ Web is already running at http://localhost:$WEB_PORT"
else
  start_web
  for i in {1..20}; do
    if is_port_open $WEB_PORT; then
      echo "✅ Web is now running"
      break
    fi
    echo "⏳ Waiting for web to start... ($i)"
    sleep 1
  done
fi

start_electron



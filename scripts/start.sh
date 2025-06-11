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

wait_for_web_ready() {
  for i in {1..20}; do
    # if curl -s "http://localhost:$WEB_PORT" | grep -q "<!DOCTYPE html>"; then
    if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$WEB_PORT" | grep -q "^2"; then

      echo "✅ Web page is ready!"
      return 0
    fi
    echo "⏳ Waiting for full page response... ($i)"
    sleep 1
  done
  echo "❌ Web didn't become ready in time."
  exit 1
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
  wait_for_web_ready
fi

start_electron

trap "kill $WEB_PID " EXIT
wait $WEB_PID

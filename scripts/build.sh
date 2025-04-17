#!/bin/bash

WEB_DIR="web-app"
ELECTRON_DIR="electron"

info() {
  echo -e "\033[1;34m[INFO]\033[0m $1"
}

success() {
  echo -e "\033[1;32m[SUCCESS]\033[0m $1"
}

error() {
  echo -e "\033[1;31m[ERROR]\033[0m $1"
}

# 构建 Web 应用
build_web() {
  info "Building web-app..."
  cd "$WEB_DIR" || { error "Web directory not found"; exit 1; }

  if pnpm run build:web; then
    success "Web-app built successfully."
  else
    error "Web-app build failed."
    exit 1
  fi

  cd - > /dev/null
}

# 构建 Electron 应用
build_electron() {
  info "Building Electron app..."
  cd "$ELECTRON_DIR" || { error "Electron directory not found"; exit 1; }

  if npm run build:release; then
    success "Electron app built successfully."
  else
    error "Electron build failed."
    exit 1
  fi

  cd - > /dev/null
}

# 执行顺序
build_web
build_electron

success "✅ All builds completed successfully."

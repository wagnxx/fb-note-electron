#!/bin/bash

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

# Step 1: 构建 TypeScript
info "Building TypeScript..."
if ! npm run build:tsc > /dev/null 2>&1; then
  error "TypeScript build failed. See details below:"
  npm run build:tsc 2>&1 | grep 'error'
  exit 1
fi

success "TypeScript build succeeded."

# Step 2: 构建 Electron
info "Building Electron..."
if ! npm run build:ele; then
  error "Electron build failed."
  exit 1
fi

success "Electron build succeeded."

#!/bin/bash
set -e
echo "🛠 Building electron main process..."

# 1. 清空 dist
rm -rf dist
mkdir -p dist


# 2. 执行 rollup 构建
echo "🚀 Starting tsc by rollup..." 
NODE_ENV=development rollup -c ./rollup.config.mjs

# 3. 拷贝 package.json 和生产依赖 node_modules
echo "📦 Installing production dependencies..."

cp package.json dist/
cp -r ../node_modules dist/
cd dist && npm prune --omit=dev
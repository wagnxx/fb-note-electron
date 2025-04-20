#!/bin/bash
set -e
echo "🛠 Building electron main process..."

# ----------------------
# Step 1: 清空 dist
# ----------------------
rm -rf dist
mkdir -p dist

# ----------------------
# Step 2: 执行 rollup 构建
# ----------------------
echo "🚀 Starting tsc by rollup..."
NODE_ENV=production rollup -c ./rollup.config.mjs

# ----------------------
# Step 3: 生产依赖缓存优化
# ----------------------
PACKAGE_JSON="package.json"
TEMP_DIR=".temps"
DIST_DIR="dist"
NODE_MODULES_DIR="$TEMP_DIR/node_modules"
PACKAGE_JSON_TEMP="$TEMP_DIR/package.json"

mkdir -p "$TEMP_DIR"

if ! command -v jq &> /dev/null; then
  echo "❌ 'jq' is not installed. Please install jq to continue."
  exit 1
fi

if [ ! -d "$NODE_MODULES_DIR" ] || [ ! -f "$PACKAGE_JSON_TEMP" ]; then
  echo "🔧 Initializing production dependencies in temp/node_modules..."
  cp "$PACKAGE_JSON" "$PACKAGE_JSON_TEMP"
  npm install --omit=dev --prefix "$TEMP_DIR"
else
  echo "🧠 Checking for dependency changes..."
  dependencies=$(jq -S '.dependencies' "$PACKAGE_JSON")
  temp_dependencies=$(jq -S '.dependencies' "$PACKAGE_JSON_TEMP")

  if [ "$dependencies" != "$temp_dependencies" ]; then
    echo "🔁 Dependencies changed. Updating..."
    cp "$PACKAGE_JSON" "$PACKAGE_JSON_TEMP"
    rm -rf "$NODE_MODULES_DIR"
    npm install --omit=dev --prefix "$TEMP_DIR"
  else
    echo "✅ No dependency changes. Using cached node_modules."
  fi
fi

# ----------------------
# Step 4: 拷贝 package.json 和 node_modules 到 dist
# ----------------------
echo "📦 Copying production dependencies..."
cp "$PACKAGE_JSON" "$DIST_DIR/"
cp -r "$NODE_MODULES_DIR" "$DIST_DIR/node_modules"

echo "✅ Build complete."

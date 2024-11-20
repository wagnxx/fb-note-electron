#!/bin/bash
mkdir -p ./build-service && pkg ./socks-server.js --targets node18-linux-x64,node18-macos-x64,node18-win-x64 --out=./build-service/socks-server
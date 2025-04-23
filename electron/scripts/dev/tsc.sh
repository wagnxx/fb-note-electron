#!/bin/bash

echo "🚀 Starting tsc by rollup..." 
NODE_ENV=development rollup -c ./rollup.config.mjs -w
# tsx esbuild.dev.ts
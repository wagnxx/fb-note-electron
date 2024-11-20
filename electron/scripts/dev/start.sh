#!/bin/bash
npm run build:tsc > /dev/null 2>&1 || (echo 'Error in build:tsc. See details below:' && npm run build:tsc 2>&1 | grep 'Error') && npm run dev:ele
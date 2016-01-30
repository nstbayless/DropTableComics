#!/bin/bash
echo "compiling TypeScript files..."
tsc --module CommonJS config.ts
tsc --module CommonJS app.ts
tsc --module CommonJS www.ts
echo "Compiling routes..."
tsc --module CommonJS routes/*.ts
echo "Compiling backend..."
tsc --module CommonJS src/*.ts
echo "Complete"

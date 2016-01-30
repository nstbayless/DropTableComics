#!/bin/bash
echo "compiling TypeScript files..."
tsc --module amd config.ts
tsc --module amd app.ts
tsc --module amd www.ts
echo "Compiling routes..."
tsc --module amd routes/*.ts
echo "Compiling backend..."
tsc --module amd src/*.ts
echo "Complete"

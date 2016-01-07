#!/bin/bash
echo "compiling TypeScript files..."
tsc app.ts
echo "Compiling routes..."
tsc routes/*.ts
echo "Complete"

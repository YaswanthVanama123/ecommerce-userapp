#!/bin/bash

echo "🛑 Stopping dev server..."
lsof -ti:5173 | xargs kill -9 2>/dev/null

echo "🧹 Clearing Vite cache..."
rm -rf node_modules/.vite

echo "✨ Starting fresh dev server..."
npm run dev

#!/bin/bash
set -e

echo "🚀 Building Uveitis AI Diagnosis System Frontend..."
npm run build

echo "✨ Starting Local Production Preview Server..."
npx serve -s dist -l 80

#!/usr/bin/env node
/**
 * Manual build script for intelligence-os
 * Uses existing globally installed or node_modules tsup
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const files = [
  'src/index.ts',
  'src/mcp-server.ts',
  'src/artifact-flow/index.ts',
  'src/infogenius/index.ts',
  'src/daemon/index.ts',
  'src/daemon/daemon-runner.ts',
  'src/state/index.ts',
  'src/plugins/index.ts',
  'src/http/index.ts',
  'src/studio/index.ts'
];

// Try different tsup locations
const tsupLocations = [
  // Global npm
  path.join(process.env.APPDATA || '', 'npm', 'node_modules', 'tsup', 'dist', 'cli-default.js'),
  // Local node_modules (npm)
  path.join(__dirname, 'node_modules', 'tsup', 'dist', 'cli-default.js'),
  // Local pnpm
  path.join(__dirname, 'node_modules', '.pnpm', 'tsup@8.5.1_postcss@8.5.6_typescript@5.9.3', 'node_modules', 'tsup', 'dist', 'cli-default.js'),
  // System
  '/usr/local/bin/tsup',
  '/usr/bin/tsup'
];

let tsupPath = null;
for (const location of tsupLocations) {
  if (fs.existsSync(location)) {
    tsupPath = location;
    console.log(`Found tsup at: ${location}`);
    break;
  }
}

if (!tsupPath) {
  console.error('❌ tsup not found. Please run: npm install -g tsup');
  process.exit(1);
}

const cmd = `node "${tsupPath}" ${files.join(' ')} --format cjs,esm --dts`;

console.log('🏗️  Building intelligence-os...');
console.log(`Command: ${cmd}`);

try {
  execSync(cmd, {
    cwd: __dirname,
    stdio: 'inherit'
  });
  console.log('✅ Build successful!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const distPath = path.resolve(__dirname, '../dist/index.js');

if (!fs.existsSync(distPath)) {
  console.error(
    '\x1b[31mError: Missing build output "../dist/index.js".\x1b[0m\n' +
    'If you are using create-scryme-app locally or from source, please run "pnpm build" or "pnpm --filter create-scryme-app build" first.'
  );
  process.exit(1);
}

require(distPath);

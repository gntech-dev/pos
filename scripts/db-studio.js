#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unused-vars */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Find the project root (directory containing package.json)
let currentDir = process.cwd();
let projectRoot = currentDir;

while (projectRoot !== path.dirname(projectRoot)) {
  if (fs.existsSync(path.join(projectRoot, 'package.json'))) {
    break;
  }
  projectRoot = path.dirname(projectRoot);
}

// Change to project root
process.chdir(projectRoot);

// Run prisma studio
try {
  execSync('prisma studio --schema=database/prisma/schema.prisma', {
    stdio: 'inherit',
    cwd: projectRoot
  });
} catch (error) {
  process.exit(1);
}
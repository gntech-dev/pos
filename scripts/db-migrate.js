#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unused-vars */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env
require('dotenv').config();

// Find the project root (directory containing package.json)
let currentDir = process.cwd();
let projectRoot = currentDir;

while (projectRoot !== path.dirname(projectRoot)) {
  if (require('fs').existsSync(path.join(projectRoot, 'package.json'))) {
    break;
  }
  projectRoot = path.dirname(projectRoot);
}

// Change to project root
process.chdir(projectRoot);
console.log('Current working directory:', process.cwd());
console.log('Project root:', projectRoot);
console.log('DATABASE_URL:', process.env.DATABASE_URL);

// Run prisma migrate
try {
  execSync('prisma migrate dev --schema=database/prisma/schema.prisma', {
    stdio: 'inherit',
    cwd: projectRoot
  });
} catch (error) {
  process.exit(1);
}
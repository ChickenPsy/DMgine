#!/usr/bin/env node

// Simple wrapper script to start the API server from the new location
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set environment and start the server
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const serverPath = resolve(__dirname, 'api', 'index.ts');
const child = spawn('tsx', [serverPath], {
  stdio: 'inherit',
  env: process.env
});

child.on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
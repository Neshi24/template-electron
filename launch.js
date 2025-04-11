const { spawn } = require('child_process');

const isLite = process.argv.includes('--lite');
const entry = isLite ? 'main-lite.js' : 'main.js';

const electron = require('electron');

const child = spawn(electron, [entry], {
  stdio: 'inherit',
  env: process.env,
});

const fs = require('fs');
const path = require('path');

// This script can help with Windows path issues
process.env.NODE_OPTIONS = '--max-old-space-size=4096';

// Force forward slashes
const originalResolve = path.resolve;
path.resolve = function(...args) {
  return originalResolve(...args).replace(/\\/g, '/');
};

// Run hardhat compile
require('hardhat/cli');
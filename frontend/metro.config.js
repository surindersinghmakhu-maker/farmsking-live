const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude build/cache directories from Metro watcher to lower CPU & RAM usage
config.resolver.blockList = [
  /node_modules\/.*\/node_modules/,
  /.*\.expo\/.*/,
  /.*dist\/.*/,
  /.*\.git\/.*/,
  /.*android\/app\/build\/.*/,
];

// Limit Metro worker threads so laptop doesn't freeze
config.maxWorkers = 2;

module.exports = config;

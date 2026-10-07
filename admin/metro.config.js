const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude specific build/cache directories from Metro watcher to lower CPU & RAM usage
const distDir = path.resolve(__dirname, 'dist').replace(/\\/g, '/');
const expoDir = path.resolve(__dirname, '.expo').replace(/\\/g, '/');
const androidBuildDir = path.resolve(__dirname, 'android', 'app', 'build').replace(/\\/g, '/');

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const customBlockList = [
  new RegExp(`^${escapeRegex(distDir)}(/|\\\\|$)`),
  new RegExp(`^${escapeRegex(expoDir)}(/|\\\\|$)`),
  new RegExp(`^${escapeRegex(androidBuildDir)}(/|\\\\|$)`),
  /[/\\]\.git[/\\]/,
];

if (Array.isArray(config.resolver.blockList)) {
  config.resolver.blockList.push(...customBlockList);
} else if (config.resolver.blockList) {
  config.resolver.blockList = [config.resolver.blockList, ...customBlockList];
} else {
  config.resolver.blockList = customBlockList;
}

// Limit Metro worker threads so laptop doesn't freeze
config.maxWorkers = 2;

module.exports = config;



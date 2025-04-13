const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure that all modules are resolved correctly
config.resolver.sourceExts = ['js', 'jsx', 'json', 'ts', 'tsx', 'cjs', 'mjs'];

// Add additional module resolution paths if needed
config.resolver.extraNodeModules = {
  // You can add specific package aliases here if needed
};

module.exports = config; 
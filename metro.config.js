const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Category images ported from the web app include .avif (expo-image renders it).
if (!config.resolver.assetExts.includes('avif')) {
  config.resolver.assetExts.push('avif');
}

module.exports = withNativeWind(config, { input: './src/global.css' });

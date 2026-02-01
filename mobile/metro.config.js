const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Add alias resolver
config.resolver.alias = {
  "@": path.resolve(__dirname, "app"),
};

module.exports = withNativeWind(config, { input: "./global.css" });

const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Add alias resolver
config.resolver.alias = {
  ...config.resolver.alias,
  "@": path.resolve(__dirname, "."),
};

// Ensure Hermes-incompatible syntax (like private class fields) is transpiled
config.transformer = {
  ...config.transformer,
  unstable_transformProfile: "hermes-stable",
};

module.exports = withNativeWind(config, { input: "./global.css" });

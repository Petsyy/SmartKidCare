const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// expo-sqlite's web worker imports its SQLite runtime as a WebAssembly asset.
// Custom Metro configs must keep `.wasm` in the asset extension list so static
// web exports can bundle that runtime.
if (!config.resolver.assetExts.includes("wasm")) {
  config.resolver.assetExts.push("wasm");
}

// Add alias resolver
config.resolver.alias = {
  ...config.resolver.alias,
  "@": path.resolve(__dirname, "."),
};

module.exports = withNativeWind(config, { input: "./global.css" });

module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@": "./",
            "@app": "./app",
            "@assets": "./assets",
            "@components": "./components",
            "@hooks": "./hooks",
            "@utils": "./utils",
            "@services": "./services",
            "@constants": "./constants",
            "@types": "./types",
            "lucide-react-native": "./src/shims/lucide-react-native",
          },
        },
      ],
      "react-native-reanimated/plugin", // must be last
    ],
  };
};

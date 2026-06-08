const nodeExternals = require("webpack-node-externals");
const path = require("path");
const webpack = require("webpack");

module.exports = function (options) {
  const forkTsPlugin = options.plugins.find(
    (p) => p.constructor.name === "ForkTsCheckerWebpackPlugin",
  );
  if (forkTsPlugin) {
    forkTsPlugin.options.typescript.memoryLimit = 4096;
  }
  return {
    ...options,
    externals: [
      {
        "server-only":
          "commonjs " + path.resolve(__dirname, "src/lib/empty.ts"),
      },
      nodeExternals({
        allowlist: [/^@repo/],
      }),
    ],
    resolve: {
      ...options.resolve,
      alias: {
        ...options.resolve.alias,
        "@": path.resolve(__dirname, "src"),
        "@repo/zitadel/server": path.resolve(
          __dirname,
          "src/zitadel/zitadel.service.ts",
        ),
        "@repo/zitadel": path.resolve(
          __dirname,
          "src/zitadel/zitadel.service.ts",
        ),
      },
    },
  };
};

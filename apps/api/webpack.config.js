const nodeExternals = require("webpack-node-externals");
const path = require("path");
const webpack = require("webpack");

module.exports = function (options) {
  const isProd = process.env.NODE_ENV === "production";

  const forkTsPluginIndex = options.plugins.findIndex(
    (p) => p.constructor.name === "ForkTsCheckerWebpackPlugin",
  );

  if (forkTsPluginIndex !== -1) {
    if (!isProd) {
      // Remove the plugin in dev mode to save memory and speed up build
      options.plugins.splice(forkTsPluginIndex, 1);
    } else {
      // In production, keep it but ensure memory limit is sufficient
      options.plugins[forkTsPluginIndex].options.typescript.memoryLimit = 4096;
    }
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

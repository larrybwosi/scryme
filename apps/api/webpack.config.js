const path = require("path");
const nodeExternals = require("webpack-node-externals");

const SRC_DIR = path.resolve(__dirname, "src");
const EMPTY_MODULE = path.resolve(SRC_DIR, "lib/empty.ts");

module.exports = function modifyWebpackConfig(options) {
  const isDev = options.mode === "development";

  // 1. Optimize Type-Checking Process
  if (options.plugins) {
    const forkTsPluginIndex = options.plugins.findIndex(
      p => p?.constructor?.name === "ForkTsCheckerWebpackPlugin",
    );

    if (forkTsPluginIndex !== -1) {
      if (isDev) {
        // Skip type-checking entirely in dev — let the IDE/tsc --watch handle it.
        options.plugins.splice(forkTsPluginIndex, 1);
      } else {
        const plugin = options.plugins[forkTsPluginIndex];
        if (plugin?.options?.typescript) {
          plugin.options.typescript.memoryLimit = 4096;
          plugin.options.async = false; // Fail fast in CI if type-checking fails
        }
      }
    }
  }

  // 2. Replace ts-loader with ultra-fast swc-loader
  if (options.module && options.module.rules) {
    options.module.rules = options.module.rules.map(rule => {
      const isTsLoader =
        rule.loader?.includes("ts-loader") ||
        (Array.isArray(rule.use) &&
          rule.use.some(u => (u.loader || u).includes("ts-loader")));

      if (isTsLoader) {
        return {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: {
            loader: "swc-loader",
            options: {
              jsc: {
                target: "es2022",
                parser: {
                  syntax: "typescript",
                  decorators: true,
                  dynamicImport: true,
                },
                transform: {
                  legacyDecorator: true,
                  decoratorMetadata: true, // Crucial for NestJS Dependency Injection
                },
                keepClassNames: true, // Crucial for NestJS controllers/entities naming
              },
            },
          },
        };
      }
      return rule;
    });
  }

  return {
    ...options,

    // 3. Persistent Filesystem Caching
    cache: isDev
      ? { type: "filesystem", buildDependencies: { config: [__filename] } }
      : false, // Clean builds in CI/CD pipelines

    // 4. Drop heavy source maps in production to save build memory
    ...(isDev ? {} : { devtool: false }),

    externals: [
      {
        "server-only": `commonjs ${EMPTY_MODULE}`,
      },
      nodeExternals({
        allowlist: [/^@repo/],
      }),
      // Native or heavy dependencies moved to shared packages
      // should be marked as external to avoid Webpack bundling issues.
      "sharp",
      "qrcode",
    ],

    resolve: {
      ...options.resolve,
      extensionAlias: options.resolve?.extensionAlias || {
        ".js": [".ts", ".js"],
      },
      alias: {
        ...options.resolve?.alias,
        "@": SRC_DIR,
      },
      // 5. Restrict module scanning to slash I/O overhead
      modules: [SRC_DIR, "node_modules"],
    },

    performance: {
      hints: false,
    },

    // 6. Disable heavy frontend-centric chunk optimization for Node bundle
    optimization: {
      ...options.optimization,
      splitChunks: false,
      removeAvailableModules: false,
      removeEmptyChunks: false,
    },
  };
};

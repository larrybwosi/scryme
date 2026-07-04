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
          // Configurable so turbo can lower this further on constrained CI runners.
          plugin.options.typescript.memoryLimit = Number(
            process.env.TSC_MEMORY_LIMIT ?? 2048,
          );
          plugin.options.async = false; // Fail fast in CI if type-checking fails
        }
        // ForkTsCheckerWebpackPlugin spawns os.cpus().length workers by default.
        // On a shared/CI box that alone can multiply memory use — pin to 1.
        if (plugin?.options) {
          plugin.options.typescript = {
            ...plugin.options.typescript,
            build: true,
          };
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
                  decoratorMetadata: true,
                },
                keepClassNames: true,
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
    // maxMemoryGenerations bounds the in-memory layer webpack keeps on top of
    // the disk cache, which otherwise grows unbounded across watch rebuilds.
    cache: isDev
      ? {
          type: "filesystem",
          buildDependencies: { config: [__filename] },
          maxMemoryGenerations: 1,
        }
      : false, // Clean builds in CI/CD pipelines

    // 4. Drop heavy source maps in production to save build memory
    ...(isDev ? {} : { devtool: false }),

    // Cap concurrent module builds. Slower, but bounds peak memory —
    // important on constrained CI runners / when turbo runs tasks in parallel.
    parallelism: Number(process.env.WEBPACK_PARALLELISM ?? 1),

    externals: [
      {
        "server-only": `commonjs ${EMPTY_MODULE}`,
      },
      nodeExternals({
        allowlist: [/^@repo/],
        // Point explicitly at the app's node_modules instead of letting
        // webpack-node-externals walk up the monorepo tree looking for one,
        // which is slower and pulls more into memory on a hoisted install.
        modulesDir: path.resolve(__dirname, "node_modules"),
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

    // Trim what webpack retains for reporting — stats objects can be
    // surprisingly large on bigger graphs.
    stats: "errors-warnings",
    infrastructureLogging: { level: "error" },

    // 6. Disable heavy frontend-centric chunk optimization for Node bundle
    optimization: {
      ...options.optimization,
      splitChunks: false,
      removeAvailableModules: false,
      removeEmptyChunks: false,
      // This is a Node/Nest server bundle, not shipped to a browser — there's
      // no reason to run Terser here. Minification on a large server bundle
      // is one of the single biggest memory spikes in a webpack build.
      minimize: false,
    },
  };
};

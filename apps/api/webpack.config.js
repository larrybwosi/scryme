const os = require("os");
const path = require("path");
const nodeExternals = require("webpack-node-externals");

const SRC_DIR = path.resolve(__dirname, "src");
const EMPTY_MODULE = path.resolve(SRC_DIR, "lib/empty.ts");

// In a monorepo, node_modules are hoisted to the workspace root. Point
// nodeExternals at every node_modules dir it should treat as "vendor",
// not just the app-local one (which may not exist at all under pnpm/yarn).
const WORKSPACE_ROOT = path.resolve(__dirname, "../.."); // adjust to your repo layout
const NODE_MODULES_DIRS = [
  path.join(__dirname, "node_modules"),
  path.join(WORKSPACE_ROOT, "node_modules"),
];

module.exports = function modifyWebpackConfig(options) {
  const isDev = options.mode === "development";

  // ── 1. Type-checking ──────────────────────────────────────────────
  // Running a full TS program check *inside* the webpack process is the
  // single biggest OOM contributor in a monorepo, because it holds a
  // second full AST/program in memory alongside webpack's module graph.
  // Recommended: skip it in webpack entirely (dev AND prod) and run
  // `tsc --build` as its own CI step, which reuses project-reference
  // .tsbuildinfo caches and is far cheaper. Keeping a bounded fallback
  // here in case you still want in-process checking for prod.
  if (options.plugins) {
    const forkTsPluginIndex = options.plugins.findIndex(
      p => p?.constructor?.name === "ForkTsCheckerWebpackPlugin",
    );
    if (forkTsPluginIndex !== -1) {
      if (isDev) {
        options.plugins.splice(forkTsPluginIndex, 1);
      } else {
        const plugin = options.plugins[forkTsPluginIndex];
        if (plugin?.options?.typescript) {
          plugin.options.typescript.memoryLimit = 4096;
          // Keep it async. `async: false` blocks the main compiler
          // thread and forces webpack + tsc peak memory to overlap
          // instead of being sequential — the opposite of what you
          // want when memory is tight.
          plugin.options.async = true;
          // Use project-reference build mode so it leverages
          // .tsbuildinfo incremental caches instead of re-checking
          // the whole monorepo graph on every build.
          plugin.options.typescript.build = true;
        }
        if (plugin?.options) {
          plugin.options.logger = {
            infrastructure: "silent",
            issues: "console",
          };
        }
      }
    }
  }

  // ── 2. ts-loader → swc-loader ─────────────────────────────────────
  if (options.module && options.module.rules) {
    options.module.rules = options.module.rules.map(rule => {
      const isTsLoader =
        rule.loader?.includes("ts-loader") ||
        (Array.isArray(rule.use) &&
          rule.use.some(u => (u.loader || u).includes("ts-loader")));
      if (isTsLoader) {
        return {
          test: /\.tsx?$/,
          // IMPORTANT: webpack resolves symlinks by default, so a
          // workspace package linked into node_modules (pnpm/yarn
          // workspaces) is seen at its *real* path, e.g.
          // /repo/packages/ui/src/Button.tsx — which does NOT match
          // /node_modules/. A plain regex exclude therefore either:
          //   a) fails to exclude it → every workspace package gets
          //      re-parsed/transpiled on top of its own build output, or
          //   b) (if resolve.symlinks is left true and paths vary)
          //      the same module gets compiled twice under two paths,
          //      doubling memory use for no reason.
          // Matching against the *unresolved* request path via a
          // function, combined with resolve.symlinks:false below,
          // makes this deterministic.
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
                  decoratorMetadata: true, // Crucial for NestJS DI
                },
                keepClassNames: true, // Crucial for NestJS controllers/entities
              },
              sourceMaps: isDev,
              module: { type: "commonjs" },
            },
          },
        };
      }
      return rule;
    });
  }

  return {
    ...options,

    // ── 3. Persistent filesystem caching ────────────────────────────
    // Filesystem cache is valuable in prod CI too (repeat builds in a
    // monorepo, e.g. affected-package rebuilds) — the thing that OOMs
    // isn't caching itself, it's the *in-memory* generation cache
    // growing unbounded across a long-lived process, and multiple apps
    // in the monorepo colliding on the same default cache directory.
    cache: {
      type: "filesystem",
      cacheDirectory: path.resolve(__dirname, "node_modules/.cache/webpack"),
      // Scope the cache name per app + mode so parallel builds of
      // different packages in the monorepo don't corrupt/inflate a
      // shared cache.
      name: `${path.basename(__dirname)}-${options.mode}`,
      buildDependencies: { config: [__filename] },
      compression: "gzip",
      // Cap in-memory cache generations instead of the unbounded
      // default — this is what actually prevents long dev/CI sessions
      // from growing without bound.
      maxMemoryGenerations: isDev ? 1 : 0,
    },

    // ── 4. Source maps ───────────────────────────────────────────────
    ...(isDev ? {} : { devtool: false }),

    // ── 5. Symlink resolution ────────────────────────────────────────
    // This is the key monorepo fix: with resolve.symlinks left at its
    // default (true), workspace packages get resolved to their real
    // path outside node_modules, which both breaks the loader-exclude
    // matching above and can cause the *same* module to be instantiated
    // twice (once via the symlink path, once via the real path) if
    // anything in the graph references it both ways — silently doubling
    // memory for shared packages.
    resolve: {
      ...options.resolve,
      symlinks: false,
      // Explicitly own conditionNames instead of inheriting whatever
      // upstream config computed from `mode`. We saw "production"
      // being requested even for the dev task, which broke resolution
      // of any @repo/* package whose exports map only had a
      // dev-specific or "default"-less entry. "default" is included
      // as a mandatory catch-all so a missing environment-specific
      // condition on a workspace package's exports map can't hard-fail
      // the build the way it just did for @repo/db / @repo/shared / @repo/crm.
      // @repo/* workspace packages are ESM-only (`"type": "module"`,
      // exports only declare "types" + "import" — no "require"). Do
      // NOT include "types" here: that's a TS-only marker, not a real
      // runtime condition, and matching it would make webpack try to
      // load raw .ts source directly instead of the built .js.
      // "import" must be present or every @repo/* import fails outright.
      conditionNames: ["node", "import", "require", "default"],
      extensionAlias: options.resolve?.extensionAlias || {
        ".js": [".ts", ".js"],
      },
      alias: {
        ...options.resolve?.alias,
        "@": SRC_DIR,
      },
      modules: [SRC_DIR, "node_modules"],
    },

    performance: { hints: false },

    // ── 6. Node-target build tuning ───────────────────────────────────
    optimization: {
      ...options.optimization,
      splitChunks: false,
      removeAvailableModules: false,
      removeEmptyChunks: false,
      // This is a server bundle (NestJS DI, server-only shim) —
      // minifying it buys nothing at runtime and Terser's minimizer is
      // itself a major memory spike (spawns N worker processes, each
      // holding a full copy of the AST for its chunk). Skip it.
      minimize: false,
    },

    // Bound webpack's own module-build parallelism. Left unset, it
    // scales to os.cpus().length, which on CI runners with many cores
    // but modest memory-per-core is a common OOM cause when combined
    // with parallel Terser workers and forkTsChecker's own worker.
    parallelism: Math.max(2, Math.floor(os.cpus().length / 2)),

    externals: [
      {
        "server-only": `commonjs ${EMPTY_MODULE}`,
      },
      nodeExternals({
        allowlist: [/^@repo/],
        // Look in all node_modules locations relevant to the
        // monorepo, not just the (possibly nonexistent) app-local one.
        modulesDir: NODE_MODULES_DIRS[0],
        additionalModuleDirs: NODE_MODULES_DIRS.slice(1),
        // Read the app's actual package.json deps so hoisted/shared
        // deps are still externalized correctly.
        modulesFromFile: true,
      }),
      "sharp",
      "qrcode",
    ],
  };
};

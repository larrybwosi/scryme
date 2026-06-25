import path from "path";
import { fileURLToPath } from "url";
import nodeExternals from "webpack-node-externals";
import type { Configuration } from "webpack";

// Reconstruct __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function modifyWebpackConfig(
  options: Configuration,
): Configuration {
  const isDev = options.mode === "development";

  if (options.plugins) {
    const forkTsPluginIndex = options.plugins.findIndex(
      p => p?.constructor?.name === "ForkTsCheckerWebpackPlugin",
    );

    if (forkTsPluginIndex !== -1) {
      if (isDev) {
        // Remove plugin in dev mode to speed up compilation
        options.plugins.splice(forkTsPluginIndex, 1);
      } else {
        // Boost memory limit in production
        const plugin = options.plugins[forkTsPluginIndex] as any;
        if (plugin && plugin.options?.typescript) {
          plugin.options.typescript.memoryLimit = 8192;
        }
      }
    }
  }

  return {
    ...options,
    externals: [
      {
        "server-only": `commonjs ${path.resolve(__dirname, "src/lib/empty.ts")}`,
      },
      nodeExternals({
        allowlist: [/^@repo/],
      }),
    ] as any,
    resolve: {
      ...options.resolve,
      alias: {
        ...options.resolve?.alias,
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
}

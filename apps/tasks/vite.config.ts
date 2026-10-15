import { defineConfig } from 'vite';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import tailwindcss from '@tailwindcss/vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    TanStackRouterVite({
      routesDirectory: './src/routes',
      generatedRouteTree: './src/routeTree.gen.ts',
    }),
    tailwindcss(),
    react(),
  ],
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, './src') },
      // `@repo/ui`'s package.json "exports" prefers a prebuilt `dist/` that
      // isn't generated in this workspace, which breaks every subpath import
      // (e.g. `@repo/ui/components/ui/button`). Resolve straight to source
      // instead, matching how the package is actually consumed here.
      { find: /^@repo\/ui\/(.*)/, replacement: path.resolve(__dirname, '../../packages/ui/src/$1') },
      { find: '@repo/ui', replacement: path.resolve(__dirname, '../../packages/ui/src/index.tsx') },
    ],
  },
  server: {
    port: 5002,
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
    },
  },
});

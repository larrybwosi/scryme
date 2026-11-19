import { defineConfig } from 'vite'
import tsConfigPaths from 'vite-tsconfig-paths'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import tailwindcss from '@tailwindcss/vite'
import viteReact from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  server: {
    port: 3006,
  },
  // Keep the production server bundle self contained, but let the dev server
  // externalize dependencies. Inlining CommonJS packages such as react in the
  // dev SSR module runner crashes with "module is not defined".
  ssr: command === 'build' ? { noExternal: true } : {},
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 2000,
  },
  plugins: [
    tsConfigPaths(),
    tanstackStart(),
    viteReact(),
    tailwindcss(),
  ],
}))

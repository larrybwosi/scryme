import { defineConfig } from 'vite'
import tsConfigPaths from 'vite-tsconfig-paths'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import tailwindcss from '@tailwindcss/vite'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  server: {
    port: 3006,
  },
  ssr: {
    external: [
      'sanity',
      'sanity/structure',
      '@sanity/vision',
      '@sanity/icons',
      '@sanity/client',
      '@sanity/image-url',
      '@portabletext/react',
      'styled-components',
    ],
    noExternal: true,
  },
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
})

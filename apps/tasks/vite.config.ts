import { defineConfig } from 'vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import tailwindcss from '@tailwindcss/vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    tanstackStart({
      srcDirectory: 'src',
      router: {
        routesDirectory: 'routes',
      },
    }),
    tailwindcss(),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
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

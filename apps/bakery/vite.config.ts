import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    tsconfigPaths: true,
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5000,
    proxy: {
      '/api/v2': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
    },
  },
});

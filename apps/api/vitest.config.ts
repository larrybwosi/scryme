import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import swc from 'unplugin-swc';
import path from 'path';

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    (swc as any).vite({
      module: { type: 'es6' },
    }) as any,
  ],
  test: {
    globals: true,
    root: './',
    environment: 'node',
    include: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
    alias: {
      '@': path.resolve(__dirname, './src'),
      'modules': path.resolve(__dirname, './src/modules'),
    },
    setupFiles: ['./vitest.setup.ts'],
  },
});

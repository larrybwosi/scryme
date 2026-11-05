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
      '@repo/shared/redis': path.resolve(__dirname, '../../packages/shared/src/redis/index.ts'),
      '@repo/shared/actions': path.resolve(__dirname, '../../packages/shared/src/actions/index.ts'),
      '@repo/shared/lib': path.resolve(__dirname, '../../packages/shared/src/lib/index.ts'),
      '@repo/shared/utils': path.resolve(__dirname, '../../packages/shared/src/utils/index.ts'),
      '@repo/shared/constants': path.resolve(__dirname, '../../packages/shared/src/constants/index.ts'),
      '@repo/shared/services/email': path.resolve(__dirname, '../../packages/shared/src/services/email/index.ts'),
      '@repo/shared/api/v2': path.resolve(__dirname, '../../packages/shared/src/api/v2/index.ts'),
      '@repo/shared/api/v3': path.resolve(__dirname, '../../packages/shared/src/api/v3/index.ts'),
      '@repo/shared/server': path.resolve(__dirname, '../../packages/shared/src/server/index.ts'),
      '@repo/shared/realtime': path.resolve(__dirname, '../../packages/shared/src/realtime/index.ts'),
      '@repo/auth/nest': path.resolve(__dirname, '../../packages/auth/src/nest.ts'),
      '@repo/documents/server': path.resolve(__dirname, '../../packages/documents/src/server.ts'),
      '@repo/db/client': path.resolve(__dirname, '../../packages/db/src/browser.ts'),
      '@repo/db': path.resolve(__dirname, '../../packages/db/src/client.ts'),
      '@': path.resolve(__dirname, './src'),
      'modules': path.resolve(__dirname, './src/modules'),
    },
    setupFiles: ['./vitest.setup.ts'],
  },
});

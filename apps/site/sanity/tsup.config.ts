import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['apps/site/sanity/run-seed.ts'],
  outDir: 'apps/site/.next/standalone/apps/site/sanity',
  format: ['esm'],
  target: 'node22',
  splitting: false,
  bundle: true,
  banner: {
    js: `import { createRequire as __createRequire } from 'module';
const require = __createRequire(import.meta.url);`,
  },
})

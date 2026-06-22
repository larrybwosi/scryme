module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@repo/db$': '<rootDir>/../db/src/client.ts',
    '^@repo/shared$': '<rootDir>/../shared/src/index.ts',
    '^@repo/shared/server$': '<rootDir>/../shared/src/server.ts',
    '^next-sanity$': '<rootDir>/../../node_modules/.pnpm/node_modules/next-sanity/dist/index.js',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!next-sanity)/',
  ],
};

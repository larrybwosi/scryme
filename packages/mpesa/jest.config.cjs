module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@repo/db$': '<rootDir>/../db/src/client.ts',
    '^@repo/shared$': '<rootDir>/../shared/src/index.ts',
    '^@repo/shared/api/v2$': '<rootDir>/../shared/src/api/v2/index.ts',
    '^@repo/shared/realtime$': '<rootDir>/../shared/src/realtime/index.ts',
    '^next-sanity$': '<rootDir>/../../node_modules/next-sanity/dist/index.js',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!next-sanity)/',
  ],
};

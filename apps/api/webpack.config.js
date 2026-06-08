const nodeExternals = require('webpack-node-externals');
const path = require('path');
const webpack = require('webpack');

module.exports = function (options) {
  return {
    ...options,
    externals: [
      {
        'server-only': 'commonjs ' + path.resolve(__dirname, 'src/lib/empty.ts'),
        'next/headers': 'commonjs ' + path.resolve(__dirname, 'src/lib/empty.ts'),
        'next/navigation': 'commonjs ' + path.resolve(__dirname, 'src/lib/empty.ts'),
      },
      nodeExternals({
        allowlist: [/^@repo/],
      }),
    ],
    resolve: {
      ...options.resolve,
      alias: {
        ...options.resolve.alias,
        '@': path.resolve(__dirname, 'src'),
        '@repo/zitadel/server': path.resolve(__dirname, 'src/zitadel/zitadel.service.ts'),
        '@repo/zitadel': path.resolve(__dirname, 'src/zitadel/zitadel.service.ts'),
        '@repo/auth/server': path.resolve(__dirname, '../../packages/auth/src/index.ts'),
      },
    },
  };
};

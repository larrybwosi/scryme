import type { Linter } from 'eslint';

const config: Linter.Config = {
  extends: ['next/core-web-vitals', 'prettier'],
  plugins: ['only-warn'],
  settings: {
    'import/resolver': {
      typescript: {
        project: __dirname + '/tsconfig.json',
      },
    },
  },
};

export default config;

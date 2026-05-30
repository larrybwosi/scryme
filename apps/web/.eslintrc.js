module.exports = {
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

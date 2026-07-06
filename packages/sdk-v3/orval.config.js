module.exports = {
  v3: {
    output: {
      mode: 'split',
      target: 'src/generated/v3.ts',
      schemas: 'src/generated/model',
      client: 'axios',
      mock: false,
      override: {
        mutator: {
          path: './src/custom-axios.ts',
          name: 'customInstance',
        },
      },
    },
    input: {
      target: '../../apps/api/v3-spec.json',
    },
  },
};

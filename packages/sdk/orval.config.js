module.exports = {
  scryme: {
    output: {
      mode: 'split',
      target: 'src/generated/scryme.ts',
      schemas: 'src/generated/model',
      client: 'axios',
      mock: false,
    },
    input: {
      target: './openapi.json',
    },
  },
};

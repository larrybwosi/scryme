/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ["@repo/eslint-config/library.js"],
  env: {
    node: true,
    es2020: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: true,
  },
  rules: {
    "turbo/no-undeclared-env-vars": [
      "error",
      {
        allowList: ["NODE_ENV", "DATABASE_URL"],
      },
    ],
  },
};

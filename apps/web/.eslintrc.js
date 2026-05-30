/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: true,
  },
  plugins: ["@typescript-eslint"],
  env: {
    node: true,
    browser: true,
    es2021: true,
  },
  globals: {
    React: "readonly",
    JSX: "readonly",
  },
  ignorePatterns: [".eslintrc.js", "next.config.js", "postcss.config.mjs"],
  rules: {
    "@typescript-eslint/no-unused-vars": "warn",
  },
};

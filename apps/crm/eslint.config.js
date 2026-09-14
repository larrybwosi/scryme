import nextPlugin from "@next/eslint-plugin-next";

export default [
  {
    ignores: [".next/**", "dist/**", "node_modules/**"],
  },
  nextPlugin.configs["core-web-vitals"],
];

import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ["dist", "node_modules", "**/generated/**"],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "react/react-in-jsx-scope": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "no-useless-assignment": "off",
    },
  }
);

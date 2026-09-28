import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    ignores: ["dist/**", "node_modules/**", ".next/**", "src/routeTree.gen.ts"],
  },
  {
    languageOptions: {
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        process: "readonly",
        fetch: "readonly",
        Headers: "readonly",
        Response: "readonly",
        Request: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        Buffer: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
      },
    },
  },
];

import { config as baseConfig } from "./library.js";
import tseslint from "typescript-eslint";

export const config = tseslint.config(
  ...baseConfig,
  {
    rules: {
      "no-undef": "off",
    },
  }
);

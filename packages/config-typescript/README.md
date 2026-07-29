# `@repo/typescript-config`

Shared, strict [TypeScript](https://www.typescriptlang.org/) base configurations (`tsconfig.json` configurations) used across all applications and packages in the Scryme monorepo.

## 📦 Configurations Available

- **`base.json`**: Global, strict compiler options.
- **`nextjs.json`**: Optimized configuration for Next.js workspace apps.
- **`react-library.json`**: Tailored for shared client-side React component packages (e.g., `@repo/ui`).
- **`node.json`**: Formatted for node/backend microservices (e.g., NestJS api).

## 🛠️ Usage

Extend the configurations in your project-level `tsconfig.json`:

```json
{
  "extends": "@repo/typescript-config/nextjs.json",
  "compilerOptions": {
    "baseUrl": "."
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"]
}
```

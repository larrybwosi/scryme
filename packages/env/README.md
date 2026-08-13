# `@repo/env`

The central configuration and schema validation package for environment variables across the Scryme workspace. It leverages [Zod](https://zod.dev/) to guarantee compile-time and runtime validation, eliminating silent crashes due to missing configuration properties.

## 🚀 Key Features

- **Unified Schema Enforcement**: Contains schema validations for databases, caches, Ably real-time keys, and host variables.
- **Fail-Fast Configuration**: Immediately stops application startups (both web apps and API endpoints) if mandatory variables are missing or incorrectly typed.
- **Fully Type-Safe**: Exposes TypeScript-mapped types generated automatically from Zod validation schemas.

---

## 🛠️ Usage

Extend or utilize the validation schema on server startups:

```typescript
import { env } from "@repo/env";

console.log(env.DATABASE_URL); // Fully type-safe and verified non-empty string
```

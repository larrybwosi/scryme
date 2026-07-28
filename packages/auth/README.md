# `@repo/auth`

The central **Authentication & Identity** package for the Scryme workspace. Built on top of [Better Auth](https://better-auth.com/), this package provides robust, unified multi-tenant authentication, custom database-extended user and session interfaces (`ExtendedUser`, `ExtendedSession`), and cross-framework auth utilities.

## 🚀 Key Features

- **Better Auth Integration**: Standardized, production-tested authentication workflows.
- **Multi-Tenant Security**: Tenant, location, and role boundaries bound directly into authentication session tokens.
- **Custom User/Session Extensions**: Custom DB fields securely handled via `ExtendedUser` and `ExtendedSession` structures, satisfying `isolatedModules` and TypeScript compilation `TS4029` rules.
- **Cross-Framework Support**:
  - **Next.js**: Exports full middleware context and clients (`/server`, `/`).
  - **NestJS**: Supports class-level guard configurations and session decorators (`/nest`).

---

## 📦 Export Map

This package implements strict `isolatedModules` subpath exports:

- `.` (Default): Client-side authentication helpers.
- `./server`: Server-side auth client and Next.js cookie/session parsers.
- `./nest`: NestJS decorators, interceptors, and Guards (`V3AuthGuard`, `@AllowPublic()`).

---

## 🛠️ Usage

To import types and helpers in your workspace apps:

```typescript
import { authClient } from "@repo/auth";
import type { ExtendedUser, ExtendedSession } from "@repo/auth/nest";
```

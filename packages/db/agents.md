# Agent Instructions (agents.md)

## Critical Constraints - Database Package

The current database setup and Prisma configuration are stable and working correctly. **DO NOT modify any of the following without explicit user consent**, as changes will cause system-wide errors.

### 1. Prisma Client Generation

- **Method:** The current generation process (configured in `prisma/schema/schema.prisma` and executed via `prisma generate`) must remain exactly as is.
- **Restriction:** Do not update, refactor, or change how the Prisma client is generated or the tools used for generation.

### 2. Prisma Schema Generator

- **Location:** `prisma/schema/schema.prisma`
- **Restriction:** Do not modify the `generator client` block. Any changes to the provider, output path, or binary targets are prohibited.
- **Reference State:**
  ```prisma
  generator client {
    provider        = "prisma-client"
    output          = "../../generated"
    binaryTargets   = ["native", "linux-musl", "linux-musl-openssl-3.0.x"]
  }
  ```

### 3. Client & Browser Entrypoints

The following files in the `src/` directory are critical for the package exports and runtime behavior. **Do NOT modify them in any way**:

- `src/client.ts`: Manages `PrismaClient` instantiation, the `PrismaPg` adapter, and global state for development.
- `src/browser.ts`: Provides the browser-safe entrypoint (`../generated/browser`) for types and utilities.

### 4. Generation Output Directory

- **Path:** `../../generated`
- **Restriction:** The generated Prisma client MUST remain in this directory. Do not change the `output` field in the Prisma schema or the import paths in the source files that depend on this directory.

---

_Note: This file is a mirror of GEMINI.md, which is used by the Gemini CLI to enforce these mandates._

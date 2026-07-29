# Scryme API Reference Documentation

**Scryme Docs** is a static documentation portal built using [Vite](https://vite.dev/) and React. It serves the OpenAPI-compliant REST API reference for the Scryme V3 platform, making it easy for third-party developers, partners, and internal teams to integrate with the ecosystem.

## 🚀 Key Features

- **Static OpenAPI Spec Rendering**: Fast, single-page application rendering.
- **Auto-Syncing Specs**: Pre-build/pre-development hooks automatically synchronize the JSON specification directly from the `@repo/v3-sdk` OpenAPI definition.
- **Responsive Navigation**: Clear side-by-side split view of endpoint descriptions, schemas, parameters, and interactive request structures.

---

## 🛠️ Tech Stack

- **Bundler**: [Vite](https://vite.dev/)
- **Frontend Framework**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)

---

## 🏁 Getting Started

### Prerequisites

- **Node.js** v22 or later
- **pnpm** v9 or later

### Setup and Build

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Pre-requisite Build**
   Ensure the core SDK specification is built first:
   ```bash
   pnpm --filter "@repo/v3-sdk" build
   ```

3. **Start Development Server**
   Start Vite to run the docs locally:
   ```bash
   pnpm --filter docs dev
   ```
   The development server will automatically run the `predev` lifecycle script to copy `packages/v3-sdk/openapi.json` into the docs assets folder.

---

## 🚢 Deployment

### Docker & Nginx
The documentation site is optimized to be served as a lightweight, static client bundle using **Nginx** listening on port `3008` (configurable via envs).

```bash
docker build -t scryme-docs -f apps/docs/Dockerfile .
```

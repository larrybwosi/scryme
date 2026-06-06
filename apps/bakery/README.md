# Scryme Bakery

**Scryme Bakery** is a specialized desktop application built with [Tauri](https://tauri.app/) designed for bakery production management. It combines the performance of Rust with the flexibility of React to provide an offline-capable tool for bakers.

## 🚀 Features

- **Recipe Management**: Store and scale complex recipes with precise ingredient tracking.
- **Production Batches**: Track production runs from ingredients to finished goods.
- **Inventory Management**: Specialized tracking for raw materials (flour, yeast, etc.) and finished products.
- **Local-First Mode**: Works fully offline with a local SQLite database, syncing to the cloud when available.

---

## 🛠️ Tech Stack

- **Framework**: [Tauri v2](https://tauri.app/)
- **Frontend**: [React](https://react.dev/) & [Tailwind CSS 4](https://tailwindcss.com/)
- **Backend**: [Rust](https://www.rust-lang.org/)
- **Database**: [SQLite](https://sqlite.org/) (via Tauri SQL plugin)

---

## 🏁 Development Setup

### Prerequisites

- **Node.js** v22+
- **pnpm** v9+
- **Rust** v1.75+
- **OS-specific build tools** (Visual Studio C++ on Windows, Xcode on macOS, build-essential on Linux)

### Steps

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Run in Development Mode**
   ```bash
   pnpm --filter bakery tauri dev
   ```

---

## 🚢 Distribution (Production)

To create a production-ready installer for your operating system:

```bash
pnpm --filter bakery tauri build
```

The installer will be generated in `apps/bakery/src-tauri/target/release/bundle/`.

---

## 🔐 Authentication (Local Mode)

By default, the app provides a local admin account for initial setup:

- **Email:** `admin@bakery.local`
- **Password:** `admin123`

These can be changed in **Settings > Security** after login.

# Scryme POS

**Scryme POS** is a high-performance, offline-first Point of Sale application built with [Tauri](https://tauri.app/). It is designed for speed, reliability, and seamless integration with hardware peripherals.

## 🚀 Features

- **Fast Checkout**: Optimized search and cart management for high-volume sales.
- **Hardware Integration**: Native support for thermal printers, barcode scanners, and cash drawers.
- **Offline Resilience**: Continue making sales even when the internet is down; data syncs automatically when reconnected.
- **Multi-Location**: Easily switch between different business branches.
- **Payment Methods**: Integrated support for Cash, Card, and M-Pesa.

---

## 🛠️ Tech Stack

- **Framework**: [Tauri v2](https://tauri.app/)
- **Frontend**: [React 19](https://react.dev/) & [Tailwind CSS 4](https://tailwindcss.com/)
- **Backend**: [Rust](https://www.rust-lang.org/)
- **Database**: SQLite (Local) & PostgreSQL (Cloud Sync)
- **Real-time**: [Ably](https://ably.com/)

---

## 🏁 Development Setup

### Prerequisites

- **Node.js** v22+
- **pnpm** v9+
- **Rust** v1.75+
- **OS-specific build tools**

### Steps

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Run in Development Mode**
   ```bash
   pnpm --filter pos tauri dev
   ```

---

## 🚢 Distribution (Production)

To build the executable and installer:

```bash
pnpm --filter pos tauri build
```

The output can be found in `apps/pos/src-tauri/target/release/bundle/`.

---

## 🔧 Configuration

### Onboarding
On first launch, you will be prompted for an **API Key**. This registers the device to your organization and downloads the necessary catalog and settings.

### Hardware Setup
Go to **Settings > Printer** to configure your thermal printer. Supports USB and Network (IP) printing.

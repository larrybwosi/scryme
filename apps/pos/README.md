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

## 🔧 CI/CD & Updates

To enable automatic updates and successful builds in GitHub Actions, you must configure the following secrets in your repository:

### 🔑 Generating Signing Keys

Run the following command to generate a new key pair:

```bash
pnpm --filter pos tauri signer generate -w src-tauri/pos-updater.key
```

### 🔐 GitHub Secrets

Add these secrets to your GitHub repository settings under **Secrets and variables > Actions**:

| Secret Name | Description |
| ----------- | ----------- |
| `POS_TAURI_SIGNING_PRIVATE_KEY` | The content of the generated `.key` file (private key). |
| `POS_TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | The password used when generating the key (if any). |
| `POS_TAURI_PUBLIC_KEY` | The public key string displayed after generation. |
| `SENTRY_DSN` | The Sentry DSN for error tracking. |
| `POSTHOG_API_KEY` | The PostHog API key for analytics. |

> **Note**: These keys are specific to the POS application. The Bakery application uses its own set of keys prefixed with `BAKERY_` (e.g., `BAKERY_TAURI_PUBLIC_KEY`).

---

## 🔧 Configuration

### Onboarding
On first launch, you will be prompted for an **API Key**. This registers the device to your organization and downloads the necessary catalog and settings.

### Hardware Setup
Go to **Settings > Printer** to configure your thermal printer. Supports USB and Network (IP) printing.

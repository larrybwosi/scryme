# Dealio Desktop

![Version](https://img.shields.io/badge/version-3.1.0--beta.4-blue.svg)
[![License](https://img.shields.io/badge/License-PolyForm%20Noncommercial-red.svg)](LICENSE)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/larrybwosi/dealio-desktop/actions)

**Dealio Desktop** is a modern, cross-platform Point of Sale (POS) application designed to empower businesses with efficient sales management, inventory tracking, and customer engagement tools. Built with the robust Tauri framework, it leverages the performance of Rust and the flexibility of React to deliver a blazing-fast, offline-first experience.

---

## 📋 Table of Contents

- [Dealio Desktop](#dealio-desktop)
  - [📋 Table of Contents](#-table-of-contents)
  - [🚀 Features](#-features)
    - [Core Capabilities](#core-capabilities)
    - [Enterprise Features](#enterprise-features)
    - [Business-Specific Functionality](#business-specific-functionality)
  - [🛠️ Tech Stack](#-tech-stack)
  - [📦 Installation & Getting Started](#-installation--getting-started)
    - [Prerequisites](#prerequisites)
    - [Setup Guide](#setup-guide)
  - [📱 Usage Guide](#-usage-guide)
  - [🔧 Configuration](#-configuration)
  - [🔌 API Integration](#-api-integration)
  - [🤝 Contributing](#-contributing)
  - [📄 License](#-license)
  - [📞 Support](#-support)

---

## 🚀 Features

Dealio Desktop is versatile, adaptable to various business models through pre-configured templates.

### Core Capabilities

- **Seamless Sales Processing**: Fast checkout with product search, cart management, and mixed payment methods (Cash, Card, M-Pesa).
- **Robust Inventory**: Real-time stock tracking, variant management (sizes, colors), batch tracking, and low-stock alerts.
- **Product Pagination**: Efficiently manage large inventories with high-performance pagination.
- **Offline-First Architecture**: Continue operations without an internet connection; data syncs automatically when online.
- **Customer CRM**: Maintain detailed customer profiles, purchase history, and loyalty points.
- **Comprehensive Analytics**: Visual dashboards for sales trends, top products, and revenue analysis.
- **Receipt customization**: Professional PDF receipt generation with custom logos, headers, and footers.
- **Receipt Preview**: Modern, reliable receipt generation and preview using React PDF.
- **Peripherals Support**: Integration with thermal printers, barcode scanners, and cash drawers.
- **Network Printing**: Support for network-connected thermal printers for flexible kitchen and counter setups.

### Enterprise Features

- **Background Sale Syncing**: Reliable data synchronization that works in the background without interrupting your flow.
- **Manual Update Checks**: Stay up-to-date with the latest versions and features via manual check-for-updates.
- **Location Switching**: Seamlessly manage and switch between multiple business locations within a single session.
- **Stock Transfers**: Comprehensive inventory movements including creation, acceptance, and quality check validation.
- **Integrated Telemetry**: Robust error reporting (Sentry) and usage analytics (Aptabase) to ensure system health and reliability.

### Business-Specific Functionality

- **🍽️ Restaurants & Cafes**: Table management, Kitchen Display System (KDS), dine-in/takeaway splitting.
- **💊 Pharmacies**: Prescription management and doctor tracking.
- **🏬 Retail**: Barcode scanning, wholesale/B2B pricing, and bulk purchasing.
- **🔖 Specialized**: ISBN tracking for bookstores, warranty management for electronics.

---

## 🛠️ Tech Stack

We use cutting-edge technologies to ensure stability, performance, and maintainability.

| Category       | Technology                                    | Description                                  |
| :------------- | :-------------------------------------------- | :------------------------------------------- |
| **Backend**    | [Tauri v2](https://tauri.app/)                | Secure, lightweight desktop app framework    |
| **Language**   | [Rust](https://www.rust-lang.org/)            | Performance-critical backend logic           |
| **Frontend**   | [React 19](https://react.dev/)                | UI library                                   |
| **Language**   | [TypeScript](https://www.typescriptlang.org/) | Static typing for reliability                |
| **State**      | [Zustand](https://github.com/pmndrs/zustand)  | Lightweight state management                 |
| **Styling**    | [Tailwind CSS 4](https://tailwindcss.com/)    | Utility-first CSS framework                  |
| **Database**   | Tauri Plug-in Store / SQL                     | Persistent local storage and structured data |
| **Realtime**   | [Ably](https://ably.com/)                     | Real-time notifications and updates          |
| **Monitoring** | [Sentry](https://sentry.io/)                  | Error tracking and crash reporting           |
| **Analytics**  | [Aptabase](https://aptabase.com/)             | Privacy-first telemetry and usage tracking   |

---

## 📦 Installation & Getting Started

### Prerequisites

Ensure you have the following installed on your system:

- **Node.js** (v18 or later)
- **pnpm** (preferred package manager)
- **Rust** (v1.70+ for Tauri compilation)
- **Build Tools**:
  - _Windows_: Visual Studio C++ Build Tools
  - _macOS_: Xcode Command Line Tools
  - _Linux_: `build-essential`, `libwebkit2gtk-4.0-dev`, etc.

### Setup Guide

1.  **Clone the Repository**

    ```bash
    git clone https://github.com/larrybwosi/dealio-desktop.git
    cd dealio-desktop
    ```

2.  **Install Dependencies**

    ```bash
    pnpm install
    ```

3.  **Run in Development Mode**
    This starts the frontend server and the Tauri window.

    ```bash
    pnpm tauri dev
    ```

4.  **Build for Production**
    To create an optimized executable/installer for your OS:
    ```bash
    pnpm tauri build
    ```
    The output will be located in `src-tauri/target/release/bundle/`.

---

## 📱 Usage Guide

1.  **Onboarding**: Upon first launch, enter your API key to register the device and download your business configuration.
2.  **Dashboard**: Overview of daily performance.
3.  **Point of Sale**:
    - Select items from the catalog.
    - Scan barcodes for quick addition.
    - Click "Charge" to select payment methods.
4.  **Settings**: Configure printers, receipt templates, and tax rates.

---

## 🔧 Configuration

### Receipt Templates

Customize your receipts via **Settings > Receipt Settings**. You can toggle:

- Business Logo
- Order ID / Cashier Name
- Promotional Footers

### Hardware

Dealio auto-detects connected USB thermal printers. Configure paper width (58mm/80mm) in printer settings.

---

## 🔌 API Integration

Dealio Desktop is designed to work with the **Dealio API** for centralized management.

- **Sync**: Products and Categories are pulled from the cloud.
- **Upload**: Sales and Customers are pushed to the cloud.
- **Websockets**: Instant order notifications via Ably.

---

## 🤝 Contributing

We welcome contributions! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feat/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'feat: Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feat/AmazingFeature`)
5.  Open a Pull Request

---

## 📄 License

This project is distributed under the **PolyForm Noncommercial License 1.0.0**.

> **Commercial Use Restricted**: You may not use this software for commercial purposes (generating revenue) without a separate commercial license.

See [LICENSE](LICENSE) for more information.

---

## 📞 Support

If you encounter issues or have questions:

- **Issues**: [GitHub Issues](https://github.com/larrybwosi/dealio-desktop/issues)
- **Email**: support@dealio.app

---

_Made with ❤️ by the Dealio Team._

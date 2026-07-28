# Scryme Storefront & Marketing Website

The **Scryme Storefront & Site** application is the public-facing landing page and storefront interface for the Scryme ERP platform. Built with Next.js, it leverages Sanity CMS to offer highly custom, rich editorial content alongside storefront operations.

## 🚀 Key Features

- **Sanity CMS Integration**: Pre-configured schema types for managing homepage features, storefront websites, multi-branch operations, and stock management structures dynamically.
- **Dynamic Content Sections**: Headless CMS inputs for `storefrontTitle`, `storefrontImage`, `multiBranchTitle`, `stockManagementTitle`, and more.
- **Performance Optimized**: Built with advanced Next.js caching, Tailwind CSS v4 styling, and Framer Motion for elegant, smooth page transitions.
- **Telemetry & Error Tracking**: Sentry error-only buffering and dynamic PostHog event logging to ensure rich data telemetry while respecting user privacy and optimizing quota usage.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/)
- **CMS**: [Sanity CMS](https://www.sanity.io/) (via `next-sanity`)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Analytics & Observability**: [PostHog](https://posthog.com/) & [Sentry](https://sentry.io/)

---

## 🏁 Getting Started

### Prerequisites

- **Node.js** v22 or later
- **pnpm** v9 or later

### Setup Instructions

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Environment Variables**
   Copy the example environment variables file:
   ```bash
   cp .env.example .env
   ```
   Ensure your Sanity Project ID and dataset are correctly configured.

3. **Sanity Studio Seeding**
   To seed initial content inside Sanity:
   ```bash
   pnpm --filter site run sanity:seed
   ```

4. **Run Development Server**
   Start the development server on port `3005`:
   ```bash
   pnpm --filter site dev
   ```

---

## 🚢 Deployment

### Docker
```bash
docker build -t scryme-site -f apps/site/Dockerfile .
```

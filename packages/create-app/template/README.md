# Scryme Next.js Starter E-Commerce App

This boilerplate was generated with `create-scryme-app`. It provides a full Next.js App Router setup pre-configured with `@scryme/sdk`.

## Features

- **SDK Setup**: Pre-configured Scryme V3 Client and Server SDK (`lib/scryme.ts`)
- **Cart Provider & Hook**: Full shopping cart state management with persistent storage (`providers/cart-provider.tsx`)
- **Customer Auth**: Authentication state management and profile helpers (`providers/customer-auth-provider.tsx`)
- **Product Catalog**: Dynamic catalog listing and product detail page
- **Checkout**: Payment checkout page integrating with `@scryme/sdk` checkout API
- **Tailwind CSS**: Modern styling with dark mode support

## Getting Started

First, make sure your `.env.local` contains your organization configuration:

```env
NEXT_PUBLIC_SCRYME_ORG_SLUG=your-org-slug
NEXT_PUBLIC_SCRYME_API_URL=https://api.scryme.com
```

Then run the development server:

```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see your store in action.

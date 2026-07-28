# `@repo/shared`

The core helper, integration, utility, and fallback service package for the Scryme monorepo. It centralizes common system logic that is shared by both NestJS backend endpoints and Next.js/React frontend applications.

## 🚀 Key Features

- **Resilient Redis Client**: Integrates an `InMemoryRedis` fallback class inside the wrapper (`packages/shared/src/redis/index.ts`). If the main connection triggers errors or fails to initialize, it seamlessly falls back to the local memory cache to keep services online.
- **SSRF Shielding Utility (`isSafeUrl`)**: Protects server runtimes from Server-Side Request Forgery by blocking localhost and private IP address spaces, while explicitly permitting hosts matching the configured `RUSTFS_ENDPOINT` or `RUSTFS_PUBLIC_URL` to facilitate media storage.
- **PDF Generation Delegation Client**: Contains the API delegator that wraps server-to-server JWT signing calls to offload heavy PDF invoice compilation onto the NestJS API container.
- **Ably Real-Time Hooks**: Multi-location real-time publication interfaces used to coordinate terminal states, checkout cash drawers, and bakery dashboards.
- **M-Pesa STK Push Gateway**: Shared server and client utility scripts mapping Safaricom Daraja API callbacks and payment queries.
- **General Helpers**: Common functions for date processing, monetary conversions, cryptographic tokens, QR code structures, and Tailwind utility wrappers.

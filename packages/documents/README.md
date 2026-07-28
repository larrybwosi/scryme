# `@repo/documents`

The document template engine and generation library for Scryme invoices, transaction receipts, and proof-of-delivery documents. Built on top of `@react-pdf/renderer`, it generates highly professional, clean PDF documents.

## 🚀 Key Features

- **Standardized Templates**: Integrated layouts for:
  - **Invoices**: Classic, itemized, VAT-compliant corporate invoice pages.
  - **Receipts**: Sleek, thermal-printer friendly transactional layouts.
  - **Proof Documents**: General corporate balance sheets, delivery verification slips, and inventory sheets.
- **Unified Reconciler Runtime**: To prevent complex runtime reconciliation errors like `TypeError: Cannot read properties of undefined (reading 'S')` when building Next.js apps, this package must be included in the Next.js `transpilePackages` list (found in `apps/web`, `apps/crm`, and `apps/portal` `next.config.ts`).
- **PDF Generation Delegation**: To keep web server memory footprint low, layout compilation and actual file saving is delegated to the NestJS REST API app, keeping React Client runtimes lightweight.

---

## 🛠️ Usage

To import components or compile templates:

```typescript
import { InvoiceTemplateV1 } from "@repo/documents/templates/v1/invoice";
```

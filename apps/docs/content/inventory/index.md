# Product & Variant Lifecycle Management

This operational guide provides store managers and platform operators with an end-to-end reference for managing catalog products and variants within Scryme's web dashboard.

## Overview

In Scryme, inventory cataloging separates the **Product** (the high-level item identity, classification, brand, and media) from its **Product Variants** (the sellable SKUs holding barcode numbers, specific pricing, cost structures, and stock allocations).

```
┌─────────────────────────────────────────────────────────────┐
│                       PRODUCT                               │
│  Name, Category, Brand, Media, Description, SEO             │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               ▼                               ▼
    ┌──────────────────────┐        ┌──────────────────────┐
    │   PRODUCT VARIANT    │        │   PRODUCT VARIANT    │
    │  SKU: SOU-001-SM     │        │  SKU: SOU-001-LG     │
    │  Barcode: 0123456789 │        │  Barcode: 0987654321 │
    │  Attributes: Size: S │        │  Attributes: Size: L │
    │  Retail Price: $5.00 │        │  Retail Price: $8.50 │
    │  Cost Price: $2.50   │        │  Cost Price: $4.00   │
    └──────────┬───────────┘        └──────────┬───────────┘
               │                               │
               ▼                               ▼
    ┌──────────────────────┐        ┌──────────────────────┐
    │     STOCK BATCH      │        │     STOCK BATCH      │
    │  Batch: INIT-SOU-... │        │  Batch: INIT-SOU-... │
    │  Quantity: 20 pcs    │        │  Quantity: 15 pcs    │
    │  Location: Main Store│        │  Location: Main Store│
    └──────────────────────┘        └──────────────────────┘
```

## Quick Navigation

1. **[Creating Products](./create-product.md)**
   - Opening the Product Sheet
   - Automatic SKU and URL Slug generation with live uniqueness verification
   - Setting categories, piece units, and product types
   - Configuring initial stock and automatic batch creation
2. **[Managing Product Variants](./manage-variants.md)**
   - Creating additional variants (sizes, colors, flavors)
   - Hardware barcode scanner integration and automatic input detection
   - Defining custom attribute key-value pairs
   - Setting reorder points, reorder quantities, and expiration warning thresholds
   - Bulk status toggling and deletion safeguards
3. **[Updating Details & Multi-Unit Pricing](./update-and-pricing.md)**
   - Editing general information, tags, and media
   - Understanding gross margin indicators
   - Configuring multi-tier selling units (e.g., selling by carton, box, or piece)
   - Setting location-specific reorder rules and linking primary suppliers
4. **[Archiving, Disabling & Restoring](./archive-and-restore.md)**
   - Differences between **Active**, **Disabled (Inactive)**, **Archived**, and **Deleted**
   - Soft archiving products and moving them to the vault (`/inventory/archived`)
   - Restoring archived products to active sales channels
   - Using the immutable Audit Log to inspect previous states and revert changes

## Roles & Permissions

- **Store Manager / Operator**: Can create products, manage variants, update prices, adjust inventory, and archive items.
- **Admin / Owner**: Can permanently delete items, perform bulk deletions, and revert state snapshots via the Audit Log.

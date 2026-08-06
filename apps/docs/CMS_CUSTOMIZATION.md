# Scryme V3 Catalog & CMS Customization Engine

This guide provides a comprehensive overview of the **CMS Customization Engine** for both **Products** and **Services** within the Scryme V3 platform. It details the schema, lifecycle controls, and developer guidelines required to build high-fidelity headless storefronts, booking systems, and catalog integrations.

---

## 📖 Executive Summary

To avoid rigid database structures and costly database migrations, Scryme V3 utilizes a robust, unified JSON column called `customFields` on both `Product` and `Service` models. This enables a fully-featured, rich-content **Content Management System (CMS)** right inside your product catalog.

By leveraging the `customFields` payload, developers can manage:
- **Rich Media**: Multi-image galleries with unique IDs, URLs, captions, and explicit display ordering.
- **Rich-text Content**: Beautiful, markdown-enabled details with formatting helpers.
- **Search Engine Optimization (SEO)**: Custom crawlable titles, meta descriptions, and keywords.
- **Dynamic Metadata & Attributes**: Custom key-value parameters for advanced storefront filtering.
- **Lifecycle & Layout Controls**: Publishing states, scheduling timestamps, and visual templates.

---

## 🛠️ CMS Customization Options (Schema Details)

The JSON schema structure for `customFields` is standardized across both Products and Services, with some fields optimized for eCommerce product listings. Below is a detailed breakdown of all customization properties.

### 1. `markdownDescription`
* **Type**: `string`
* **Description**: A detailed, formatting-rich description utilizing GitHub Flavored Markdown (GFM). This replaces basic plain text, enabling structured guides, bullet points, headers, bold text, blockquotes, and links.
* **Storefront Usage**: Safely parsed into HTML and rendered as the main product/service catalog article.
* **Example**:
  ```markdown
  # Sourdough Masterclass
  Learn the ancient art of baking artisan bread from scratch.

  ## What's Included:
  - 4 hours of hands-on baking instruction
  - Premium proofing basket (banneton) to take home
  - Live active starter culture
  ```

### 2. `images`
* **Type**: `array` of `ImageItem` objects
* **Description**: An ordered array of images representing the catalog item gallery. The first item in the array (`index 0`) is treated as the **Primary (Cover) Image** on listings, while subsequent items populate the interactive gallery.
* **Structure**:
  * `id` (`string`): A unique identifier for the image (useful for React `key` properties and drag-and-drop reordering states).
  * `url` (`string`): Absolute URL of the uploaded image asset.
  * `caption` (`string`): Descriptive alt-text for search engine accessibility (SEO) and screen readers.
* **Example**:
  ```json
  [
    {
      "id": "img_cover_9921",
      "url": "https://images.unsplash.com/photo-1509440159596-0249088772ff",
      "caption": "Fresh artisan sourdough loaf cooling on a wire rack"
    },
    {
      "id": "img_gallery_3342",
      "url": "https://images.unsplash.com/photo-1549931319-a545dcf3bc73",
      "caption": "Interior crumb structure showcasing open, airy pockets"
    }
  ]
  ```

### 3. `seo`
* **Type**: `object`
* **Description**: Custom metadata fields specifically targeted at search engine scrapers, web crawlers, and social media preview cards (OpenGraph / Twitter Cards).
* **Properties**:
  * `title` (`string`): Overrides the page header title. *Optimal length: 50-60 characters.*
  * `description` (`string`): Snippet explaining the page context. *Optimal length: 120-160 characters.*
  * `keywords` (`string`): Comma-separated list of key phrases.
* **Example**:
  ```json
  {
    "title": "Master Sourdough Baking Class | Scryme Bakery",
    "description": "Book a 4-hour hands-on sourdough masterclass. Learn sourdough starters, proofing, and baking. Take home active culture & equipment!",
    "keywords": "sourdough class, baking masterclass, bread workshop, learn sourdough"
  }
  ```

### 4. `customAttributes`
* **Type**: `object` (Key-Value Dictionary)
* **Description**: A dynamic map of alphanumeric parameters representing custom specifications, technical attributes, or tags. These are crucial for building multi-faceted sidebar filters (e.g. filtering by Material, Duration, or Difficulty).
* **Format**: All keys are standardized to `snake_case` or `lowercase` for consistent query handling. Values are stored as plain strings.
* **Example**:
  ```json
  {
    "difficulty": "Intermediate",
    "designed_in": "Milan, Italy",
    "maximum_participants": "12",
    "warranty_period": "2 Years"
  }
  ```

### 5. `publishStatus` (eCommerce / Product Specific)
* **Type**: `string`
* **Allowed Values**: `"Draft"`, `"Published"`, `"Scheduled"`, `"Archived"`
* **Description**: Governs the current lifecycle state of the storefront page. Heads-up clients can filter out `"Draft"` or `"Archived"` items.

### 6. `publishedAt`
* **Type**: `string` (ISO 8601 Timestamp / Null)
* **Description**: The date-time when the item was made public, or when a `"Scheduled"` item should become visible.
* **Example**: `"2026-03-01T08:00:00.000Z"`

### 7. `archivedAt`
* **Type**: `string` (ISO 8601 Timestamp / Null)
* **Description**: Timestamp of retirement. Used to audit old pages or manage legacy search engine redirects.

### 8. `layoutTemplate`
* **Type**: `string`
* **Description**: Indicates which pre-configured design style or theme the headless frontend should use to render this item.
* **Example**: `"Hero Showcase"`, `"Default Grid"`, `"Minimalist Split"`

### 9. `customSlugOverride`
* **Type**: `string`
* **Description**: Custom URL path override to support targeted SEO optimization instead of relying on the default auto-generated name-based slug.
* **Example**: `"learn-artisan-sourdough-baking-class"`

---

## 🗂️ Complete JSON Schema Definition

For API clients and automated middleware validators, here is the full JSON schema definition for the `customFields` object:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "CmsCustomFields",
  "type": "object",
  "properties": {
    "markdownDescription": {
      "type": "string",
      "description": "GitHub Flavored Markdown (GFM) rich text content."
    },
    "images": {
      "type": "array",
      "description": "Ordered image gallery. Index 0 represents the main cover image.",
      "items": {
        "type": "object",
        "required": ["id", "url"],
        "properties": {
          "id": {
            "type": "string",
            "description": "Unique image ID for reordering and DOM reconciliation keys."
          },
          "url": {
            "type": "string",
            "format": "uri",
            "description": "Direct URL of the image asset."
          },
          "caption": {
            "type": "string",
            "description": "Image description / alt-text for accessibility."
          }
        }
      }
    },
    "seo": {
      "type": "object",
      "description": "Search engine metadata tags.",
      "properties": {
        "title": {
          "type": "string",
          "maxLength": 80
        },
        "description": {
          "type": "string",
          "maxLength": 200
        },
        "keywords": {
          "type": "string"
        }
      }
    },
    "customAttributes": {
      "type": "object",
      "description": "Dynamic custom key-value metadata parameters.",
      "additionalProperties": {
        "type": "string"
      }
    },
    "publishStatus": {
      "type": "string",
      "enum": ["Draft", "Published", "Scheduled", "Archived"]
    },
    "publishedAt": {
      "type": ["string", "null"],
      "format": "date-time"
    },
    "archivedAt": {
      "type": ["string", "null"],
      "format": "date-time"
    },
    "layoutTemplate": {
      "type": "string"
    },
    "customSlugOverride": {
      "type": "string"
    }
  },
  "additionalProperties": false
}
```

---

## 📬 Concrete API Payload Examples

### 1. Creating/Updating a Service with CMS Customization
**Endpoint**: `PATCH /v3/:orgSlug/services/:serviceId`
**Payload**:
```json
{
  "name": "Artisan Sourdough Masterclass",
  "sku": "SRV-BKA-001",
  "categoryId": "cat_baking_101",
  "pricingModel": "FIXED",
  "price": 120.00,
  "estimatedDuration": 240,
  "requiresDeposit": true,
  "depositAmount": 30.00,
  "depositType": "FIXED",
  "customFields": {
    "markdownDescription": "# Sourdough Masterclass 🌾\nLearn the secrets of *lactobacilli* fermentation from our master bakers.\n\n### Course Outline\n1. **The Starter**: Cultivating your sourdough wild yeast.\n2. **Hydration & Mixing**: Structuring high-hydration doughs.\n3. **Bulk Fermentation**: Recognizing perfect proof levels.\n4. **Scoring & Baking**: Achieving the perfect *ear* and *thin, crispy crust*.",
    "images": [
      {
        "id": "img_srv_cover",
        "url": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800",
        "caption": "Baker scoring proofed sourdough loaf before loading into stone hearth oven"
      },
      {
        "id": "img_srv_crumb",
        "url": "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=800",
        "caption": "Open custard-like crumb structure display"
      }
    ],
    "seo": {
      "title": "Artisan Sourdough Baking Masterclass | Scryme Studio",
      "description": "Unlock artisan baking secrets. Book our 4-hour Sourdough Masterclass today. Equipment and dynamic starters provided!",
      "keywords": "baking course, sourdough workshop, learn bread baking, artisan bakery"
    },
    "customAttributes": {
      "maximum_participants": "12 students",
      "instructor_name": "Chef Marie Dubois",
      "skill_level": "Intermediate",
      "equipment_provided": "Banneton basket, scoring lame, scraper"
    }
  }
}
```

### 2. Creating/Updating a Product with CMS Customization
**Endpoint**: `PATCH /v3/:orgSlug/catalog/products/:productId` (or standard Product update route)
**Payload**:
```json
{
  "name": "Premium Proofing Banneton Basket",
  "sku": "PROD-BKA-BANN-02",
  "price": 24.99,
  "customFields": {
    "markdownDescription": "# Premium Round Proofing Banneton Basket 🧺\nHand-crafted from 100% natural, chemical-free Indonesian rattan cane. Ideal for drawing moisture away from high-hydration sourdough doughs.\n\n## Features\n* **Eco-Friendly**: Sourced from organic rattan fibers.\n* **Perfect Spirals**: Leaves beautiful flour spiral patterns on finished loaves.\n* **Complete Set**: Includes linen liner insert for smooth scoring preparation.",
    "images": [
      {
        "id": "img_bann_cover",
        "url": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800",
        "caption": "Artisan proofing baskets made of premium cane rattan"
      }
    ],
    "seo": {
      "title": "Organic Cane Rattan Proofing Banneton Basket | Scryme Shop",
      "description": "Buy professional Indonesian rattan cane banneton baskets. Includes linen liners. Elevate sourdough oven rise and scoring symmetry.",
      "keywords": "proofing basket, banneton, rattan banneton, sourdough proofing, baking accessories"
    },
    "customAttributes": {
      "material": "100% Natural Cane Rattan",
      "diameter": "10 inches (25cm)",
      "capacity": "Holds up to 1kg of dough",
      "origin": "Hand-woven in Indonesia"
    },
    "publishStatus": "Published",
    "publishedAt": "2026-01-15T00:00:00.000Z",
    "layoutTemplate": "eCommerce Grid",
    "customSlugOverride": "premium-proofing-cane-banneton-basket-set"
  }
}
```

---

## 🎨 Best-Practice DX Guidelines for Headless Storefronts

To deliver a spectacular user experience and optimal SEO ratings, headless storefront developers should observe these integration patterns.

### 1. Markdown Parsing
Always sanitize output when rendering custom markdown dynamically in React/Next.js or Vue applications. We recommend utilizing a secure pipeline:
```typescript
import React from 'react';
import { Marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';

export function RenderedCmsBody({ markdownText }: { markdownText: string }) {
  // 1. Initialize parser
  const marked = new Marked();

  // 2. Parse markdown to string HTML
  const rawHtml = marked.parse(markdownText);

  // 3. Purify to prevent XSS (Cross-Site Scripting) vectors
  const cleanHtml = DOMPurify.sanitize(rawHtml);

  return (
    <article
      className="prose prose-slate lg:prose-lg max-w-none dark:prose-invert"
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
}
```

### 2. Multi-Image Responsive Galleries
To speed up Cumulative Layout Shift (CLS) scores, specify exact dimensions or utilize layout components (such as `next/image`). Use the ordered `images` list:
```typescript
import Image from 'next/image';
import { useState } from 'react';

export function ImageGallery({ images }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const activeImage = images[activeIdx] || { url: '/placeholder.jpg', caption: 'No image available' };

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Primary Highlight Display */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-900 border">
        <Image
          src={activeImage.url}
          alt={activeImage.caption}
          fill
          priority
          className="object-cover transition-opacity duration-300"
        />
      </div>

      {/* 2. Horizontal Thumbnails Stripe */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {images.map((img, idx) => (
          <button
            key={img.id}
            onClick={() => setActiveIdx(idx)}
            className={`relative h-12 w-20 flex-shrink-0 border transition-all ${
              activeIdx === idx ? 'border-amber-500 ring-1 ring-amber-500' : 'border-slate-300 opacity-60'
            }`}
          >
            <Image src={img.url} alt={img.caption} fill className="object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
```

### 3. Injecting Custom Metadata for SEO Headers
Next.js Page metadata can resolve the `seo` payload at build/request time:
```typescript
import { Metadata } from 'next';

export async function generateMetadata({ params }): Promise<Metadata> {
  const item = await fetchCatalogItem(params.slug);
  const seo = item.customFields?.seo || {};

  return {
    title: seo.title || `${item.name} | Scryme Catalog`,
    description: seo.description || item.description,
    keywords: seo.keywords || 'bakery, craft, kitchen',
    openGraph: {
      title: seo.title || item.name,
      description: seo.description || item.description,
      images: [
        {
          url: item.customFields?.images?.[0]?.url || '/fallback-og.jpg',
          alt: item.customFields?.images?.[0]?.caption || item.name
        }
      ]
    }
  };
}
```

### 4. Dynamic Sidebar Filtering via `customAttributes`
If your headless client pulls lists of products/services, you can group and count dynamic attributes in-memory to build custom faceted navigation lists. For example:
```typescript
// Count unique attribute options across a catalog
export function getFacetedFilters(items) {
  const facets: Record<string, Set<string>> = {};

  items.forEach(item => {
    const attrs = item.customFields?.customAttributes || {};
    Object.entries(attrs).forEach(([key, val]) => {
      if (!facets[key]) facets[key] = new Set();
      if (val) facets[key].add(val as string);
    });
  });

  return facets; // e.g., { "material": ["Cane Rattan", "Stainless Steel"], "difficulty": ["Beginner", "Intermediate"] }
}
```

---

## ⚡ Quick Integration SDK Examples

### 📥 1. Installation Instructions

To install the official Scryme V3 SDK from npm, run the following command in your project directory:

```bash
# Using npm
npm install @scryme/sdk axios

# Using pnpm
pnpm add @scryme/sdk axios

# Using yarn
yarn add @scryme/sdk axios
```

---

### ⚙️ 2. Environment Variable Configuration

Instead of passing the organization slug (`orgSlug`) as a parameter to every single request, the SDK automatically reads it from your environment variables.

Set one of the following variables in your `.env` file depending on your build tool/runtime:

```bash
# General Node.js / Express / Next.js server environments
SCRYME_ORG_SLUG=bakery-co

# Next.js client-side accessible variables
NEXT_PUBLIC_SCRYME_ORG_SLUG=bakery-co

# Vite client-side environments
VITE_SCRYME_ORG_SLUG=bakery-co
```

When any of these environment variables are defined, the SDK will automatically inject the organization slug to all scoped endpoints, allowing you to omit the `orgSlug` parameter!

---

### 🚀 3. Fetching Customized Services via Node.js (with @scryme/sdk/server)

Here is how you initialize the client and fetch services using the new modern class-based approach. All submodules on `ScrymeServerSDK` are fully type-safe and encapsulate authentication state and automatic organization routing!

```javascript
import { ScrymeServerSDK } from '@scryme/sdk/server';

// Initialize the class-based server API client.
const scrymeServer = new ScrymeServerSDK({
  baseURL: 'https://api.scryme.tech',
  orgSlug: 'bakery-co', // Automatic orgSlug injection on all API calls!
  clientId: 'your_client_id_123',
  clientSecret: 'your_client_secret_456',
});

try {
  // 1. One-click initialization & authentication
  await scrymeServer.auth.authenticate();

  // 2. Call APIs without manually passing orgSlug or accessToken!
  const response = await scrymeServer.catalog.getServices();
  const services = response.data.data || response.data;

  services.forEach(service => {
    console.log(`Service: ${service.name}`);
    console.log(`Main Image: ${service.customFields?.images?.[0]?.url || 'None'}`);
    console.log(`Template Style: ${service.customFields?.layoutTemplate || 'Default'}`);
  });
} catch (error) {
  console.error("SDK Retrieval Failure:", error);
}
```

---

### 📝 4. Updating Product SEO & Custom Attributes via Python

```python
import requests

org_slug = "bakery-co"
product_id = "prod_proofing_basket"
url = f"https://api.scryme.tech/v3/{org_slug}/catalog/products/{product_id}"

headers = {
    "Authorization": "Bearer <YOUR_ACCESS_TOKEN>",
    "Content-Type": "application/json"
}

payload = {
    "customFields": {
        "seo": {
            "title": "Natural Cane Banneton Proofing Basket | Scryme Shop",
            "description": "Organic Indonesian rattan proofing basket.",
            "keywords": "proofing basket, sourdough"
        },
        "customAttributes": {
            "material": "Cane Rattan",
            "capacity": "1kg"
        }
    }
}

response = requests.patch(url, json=payload, headers=headers)
if response.status_code == 200:
    print("Storefront CMS configuration published successfully.")
else:
    print(f"Error {response.status_code}: {response.text}")
```

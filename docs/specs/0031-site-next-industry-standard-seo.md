# 0031 · Industry Standard SEO Architecture for Site-Next with Sanity CMS

**Status**: Accepted
**Date**: 2026-11-07
**Area**: `apps/site-next`
**Authorized by**: User approval during planning mode

## Context
`apps/site-next` is Scryme's public web application and primary organic marketing surface. While foundational Sanity document schemas and a basic `seo` object existed, metadata implementation across routes was fragmented:
- Most marketing routes (`/`, `/pricing`, `/sales`, `/crm`, `/cms`, `/payments`, `/inventory`, `/point-of-sale`, etc.) lacked comprehensive `head` metadata definitions in TanStack Router.
- Missing OpenGraph images, Twitter cards (`summary_large_image`), canonical URLs, and robots directives resulted in subpar search indexing and link preview unfurling.
- No structured data (JSON-LD) existed for enterprise discovery (`Organization`, `WebSite`, `SoftwareApplication`, `FAQPage`, or `BreadcrumbList`).
- Missing `robots.txt` and `sitemap.xml` prevented search engine crawlers from efficiently indexing public pages.

## Requirements
- **AC-1 (Enhanced Sanity SEO Schema & Settings)**:
  - Extend the `seo` object schema to support canonical URL overrides, noIndex toggles, keywords, custom social titles/descriptions, and open graph image hotspots.
  - Extend `siteSettings` schema to define global SEO defaults: default OG image, site URL (`https://scryme.tech`), title suffix/template, Twitter handle (`@ScrymeTech`), and global keywords.
- **AC-2 (Type-Safe Query Layer & Bulletproof Fallbacks)**:
  - Enhance `apps/site-next/src/sanity/queries.ts` to export typed `SeoData` interfaces and default fallback constants so the application renders complete SEO tags even if Sanity is offline or fields are empty.
- **AC-3 (Unified `createSiteSeo` Helper & JSON-LD Injection)**:
  - Build `apps/site-next/src/lib/seo.ts` providing a centralized `createSiteSeo` helper function returning TanStack Router `head` definitions (`meta`, `links`, and `scripts` containing JSON-LD).
  - Automatically generate JSON-LD schemas:
    - Global `Organization` and `WebSite` schemas.
    - `SoftwareApplication` / `Product` schema for product and marketing landing pages.
    - `FAQPage` schema on routes presenting FAQ content (e.g., Home, Pricing).
    - `BreadcrumbList` schema for hierarchical navigation.
- **AC-4 (Complete Route Coverage)**:
  - Wire `createSiteSeo` into all static routes: `/`, `/pricing`, `/sales`, `/crm`, `/cms`, `/payments`, `/inventory`, `/point-of-sale`, `/stock-ops`, `/mobile-field-ops`, `/procurement-supply-chain`, `/mcp-agent-apis`, `/project-management-scheduling`, `/locations`, and `/developers/apps`.
  - Wire dynamic loaders in `/pages/$slug`, `/compare/$slug`, and `/vs/$slug` to pull Sanity SEO records and pass them seamlessly into `createSiteSeo`.
  - Set `noIndex` on internal utility routes (e.g. `/studio/$`).
- **AC-5 (Crawler Assets: `robots.txt` and `sitemap.xml`)**:
  - Add standard `robots.txt` in `apps/site-next/public/robots.txt` referencing sitemap and disallowing `/studio/` while permitting public crawler access.
  - Add comprehensive `sitemap.xml` in `apps/site-next/public/sitemap.xml` mapping all public marketing and comparison paths with priority and change frequencies.

## Architecture & Data Flow

```
+--------------------------------------------------------------------------+
|                            Sanity CMS Studio                             |
|  - siteSettings (siteUrl, defaultOgImage, twitterHandle, titleTemplate)   |
|  - Page SEO (metaTitle, metaDescription, ogImage, canonicalUrl, noIndex) |
+-------------------------------------+------------------------------------+
                                      |
                                      v
+--------------------------------------------------------------------------+
|                    Sanity Query Layer (`queries.ts`)                     |
|  - fetchSiteSettings(), fetchHomePage(), etc.                            |
|  - Fallback guards with rich default metadata                            |
+-------------------------------------+------------------------------------+
                                      |
                                      v
+--------------------------------------------------------------------------+
|               Centralized SEO Engine (`src/lib/seo.ts`)                 |
|  - Resolves Title, Description, Canonical URL, OpenGraph, Twitter Cards  |
|  - Injects JSON-LD (Organization, WebSite, SoftwareApplication, FAQPage) |
+-------------------------------------+------------------------------------+
                                      |
                                      v
+--------------------------------------------------------------------------+
|                       TanStack Router Route Heads                        |
|  - `head: ({ loaderData }) => createSiteSeo(...)`                        |
|  - Injected directly into HTML `<head>` on SSR & Client Navigation       |
+--------------------------------------------------------------------------+
```

## Build Plan
1. Update `apps/site-next/src/sanity/schemas/objects/seo.ts` and `apps/site-next/src/sanity/schemas/documents/siteSettings.ts`.
2. Update `apps/site-next/src/sanity/queries.ts` with typed SEO models and fallbacks.
3. Create `apps/site-next/src/lib/seo.ts` with comprehensive meta and JSON-LD builders.
4. Update `__root.tsx` and all route files with `head` configurations.
5. Create `apps/site-next/public/robots.txt` and `apps/site-next/public/sitemap.xml`.
6. Run full type-check and Vite build to verify clean compilation.

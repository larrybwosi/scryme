# 0016 · Full Sanity Schemas & Content Management for Site-Next

**Status**: Accepted
**Date**: 2026-11-03
**Area**: `apps/site-next`

## Context
The `site-next` application is the primary public web application and marketing surface for Scryme ERP OS. While basic schemas existed for generic pages, comparison pages, and pricing configurations, the rest of the application (Home `/`, CRM `/crm`, CMS `/cms`, Payments `/payments`, Global Navigation, Footers, Case Studies, and Articles) relied on hardcoded content. Content managers and marketing teams had no way to independently iterate on copy, navigation items, metrics, FAQs, case studies, or blog posts in Sanity Studio (`/studio`).

## Requirements
- **AC-1 (Comprehensive Document Schemas)**: Provide Sanity document schemas for:
  - `siteSettings`: Global site configuration including brand name, logo, announcement banner, header navigation links, action buttons, footer navigation columns, copyright text, and social media handles.
  - Core page singletons: `homePage`, `crmPage`, `cmsPage`, `paymentsPage`, and `pricingConfig`.
  - Dynamic page collections: `page` (modular landing pages) and `comparisonPage` (competitor feature-by-feature tear-downs).
  - Editorial & Case Studies: `caseStudy`, `post`, `author`, and `category`.
- **AC-2 (Modular Page Builder Block Inventory)**: Expand the schema object block inventory to provide rich modular layout tools:
  - `heroBlock`, `featureGridBlock`, `bentoGridBlock`, `statsBarBlock`, `comparisonMatrixBlock`, `testimonialsBlock`, `faqAccordionBlock`, `ctaBannerBlock`, `logoCloudBlock`, `workflowStepsBlock`, `portableTextBlock`.
- **AC-3 (Organized Studio Desk Structure)**: Create a customized Sanity Studio desk structure grouping items logically into:
  - **Site Settings & Navigation** (singleton)
  - **Core Pages** (singletons for Home, Pricing, CRM, CMS, Payments)
  - **Marketing Pages & Comparisons** (lists for `page` and `comparisonPage`)
  - **Editorial & Stories** (lists for `caseStudy`, `post`, `author`, `category`)
- **AC-4 (Type-Safe Query Layer & Zero-Regression Fallbacks)**: Implement GROQ queries and TypeScript interfaces in `apps/site-next/src/sanity/queries.ts` with comprehensive fallback structures (`DEFAULT_*_FALLBACK`) ensuring the site renders reliably even when Sanity is offline, misconfigured, or running in dev mode without published documents.
- **AC-5 (Frontend Route & Component Integration)**: Wire TanStack Router loaders and components for:
  - Global `Header.tsx` and `Footer.tsx` reading `siteSettings`.
  - Home route (`/`), CMS route (`/cms`), and CRM route (`/crm`) reading live Sanity content with zero flash or styling regression.

## Architecture & Data Flow

```
+-------------------------------------------------------------------------+
|                              Sanity Studio                              |
|                              (/studio route)                            |
|                                                                         |
|  [Site Settings]     [Core Pages]       [Marketing]       [Editorial]   |
|  - siteSettings      - homePage         - page            - caseStudy   |
|                      - pricingConfig    - comparisonPage  - post        |
|                      - crmPage                            - author      |
|                      - cmsPage                            - category    |
|                      - paymentsPage                                     |
+------------------------------------+------------------------------------+
                                     |
                                     | GROQ Queries (fetchHomePage, fetchCrmPage...)
                                     v
+------------------------------------+------------------------------------+
|                      apps/site-next Data Layer                          |
|                                                                         |
|  - sanityClient.fetch(QUERY)                                            |
|  - Fallback Guard: if (!doc) return DEFAULT_*_FALLBACK                  |
+------------------------------------+------------------------------------+
                                     |
                                     | TanStack Route Loaders
                                     v
+-------------------------------------------------------------------------+
|                       Next-Gen UI Components                            |
|                                                                         |
|  - Header / Footer        <- SiteSettings                               |
|  - / (Home)               <- HomePage Data                              |
|  - /crm                   <- CrmPage Data                               |
|  - /cms                   <- CmsPage Data                               |
|  - /pages/$slug           <- PageBuilder (11 Modular Blocks)            |
+-------------------------------------------------------------------------+
```

## Security & Verification
- Read-only public Sanity client uses CDN caching.
- Content sanitized and structured to prevent XSS.
- All routes provide full static fallbacks ensuring zero downtime if Sanity API is unreachable.

# PostHog post-wizard report

The wizard completed a targeted PostHog integration for the Scryme Next.js App Router marketing site. Client-side initialization was moved to `instrumentation-client.ts` in line with current Next.js guidance, the previous provider-based setup was removed from the root layout, and the reverse-proxy rewrites were updated to respect the configured PostHog host so EU ingestion routes correctly. The integration added reusable CTA tracking helpers and instrumented core conversion surfaces across navigation, pricing, homepage CTA blocks, product hero sections, and POS download links. PostHog environment variables were written locally and mirrored into `.env.example` so the project can be configured consistently across environments.

| Event name | Description | File |
| --- | --- | --- |
| `navigation_cta_clicked` | Captures when a visitor clicks a primary navigation CTA to begin sign-in or signup. | `components/layout/navbar.tsx` |
| `pricing_plan_cta_clicked` | Captures when a visitor selects a pricing plan CTA from the pricing grid. | `components/pricing/pricing-plans.tsx` |
| `homepage_cta_clicked` | Captures when a visitor clicks a homepage closing-statement CTA. | `components/home/pricing-cta.tsx` |
| `pos_download_clicked` | Captures when a visitor downloads a POS desktop installer for a specific operating system. | `components/products/pos/pos-download-section.tsx` |
| `product_hero_cta_clicked` | Captures when a visitor clicks a product page hero CTA for a specific module and action type. | `components/products/product-hero.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics (wizard) dashboard](https://eu.posthog.com/project/137539/dashboard/821149)
- [Navigation CTA clicks over time (wizard)](https://eu.posthog.com/project/137539/insights/2b42WzGX)
- [Pricing plan clicks by plan (wizard)](https://eu.posthog.com/project/137539/insights/PgsxquQB)
- [POS downloads by platform (wizard)](https://eu.posthog.com/project/137539/insights/AnHWYbH8)
- [Hero CTA to pricing plan funnel (wizard)](https://eu.posthog.com/project/137539/insights/TGJw8p9q)
- [Homepage CTA clicks (wizard)](https://eu.posthog.com/project/137539/insights/HhWAIWFN)

## Verify before merging

- [ ] Run a full production build (the wizard only verified the files it touched) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add the exact PostHog env var names you added to `.env.example` and any monorepo/bootstrap scripts so collaborators know what to set.
- [ ] Wire source-map upload (`posthog-cli sourcemap` or your bundler's upload step) into CI so production stack traces de-minify.

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

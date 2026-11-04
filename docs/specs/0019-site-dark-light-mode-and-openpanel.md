# 0016. Site App Dark and Light Mode Support and OpenPanel Integration

**Date**: 2026-11-03
**Status**: Proposed

## Summary

This specification establishes comprehensive dark and light theme mode support across the marketing website application (`site-next`). The default theme mode resolves dynamically from the client system operating system preferences (`system`) while persisting manual overrides in client storage. Light mode adopts the high contrast editorial chalk cream palette pioneered on the homepage, while dark mode retains the Obsidian Void architecture. Theme toggle telemetry events are instrumented into OpenPanel. The deprecated standalone `/light` route is removed in favor of dynamic theme switching across all routes.

## Context

The `site-next` application previously contained an inconsistent visual experience: the homepage (`/`) and warehouse topology page (`/locations`) used hardcoded light theme colors, whereas product and solution pages (`/sales`, `/inventory`, `/crm`, `/cms`, `/payments`, `/pricing`) used hardcoded dark styling or CSS variables configured with dark mode defaults. Furthermore, a standalone `/light` route was created as an experimental canvas, leading to duplicate maintenance and fragmented user journeys.

To present a unified brand identity conforming to Obsidian Kinetic UI standards, the site must seamlessly support both dark and light modes across all routes, respond immediately to system theme changes, allow user manual toggling with animated header controls, and record telemetry in OpenPanel for analytics observability.

## Requirements

**User stories**:
- As a visitor, I want the website to automatically respect my operating system dark or light preference so that my viewing experience is comfortable.
- As a visitor, I want a theme toggle button in the header so that I can switch between dark and light modes on any page.
- As an operator, I want theme switch interactions captured in OpenPanel telemetry so that our team can track theme usage metrics.

**Acceptance criteria**:
- **AC-1**: `ThemeProvider` in `site-next` defaults to `system` mode and enables system detection with class attribute targeting.
- **AC-2**: When toggling between dark and light mode, the entire page background, text, borders, glass cards, and elevated surfaces adapt smoothly without hardcoded color clashes.
- **AC-3**: The deprecated route `/light` is deleted, and all navigation links pointing to `/light` are updated.
- **AC-4**: Toggling the theme triggers an OpenPanel telemetry event `theme_changed` with the newly activated theme name when OpenPanel is initialized.
- **AC-5**: Homepage (`/`) and core module pages (`/sales`, `/inventory`, `/crm`, `/cms`, `/payments`, `/pricing`, `/locations`) render consistently in both light and dark mode.

## Options considered

### Option 1: Native CSS Variables with NextThemes and OpenPanel Event Dispatch (Chosen)

Leverage `next-themes` with `attribute="class"`, configure semantic CSS variables in `@layer base` for `--bg-main`, `--text-main`, `--text-muted`, `--card-bg`, and `--card-border`, and adapt pages to consume standard Tailwind and CSS variables. Dispatch an OpenPanel event on toggle.

**Pros**:
- Consistent with `@repo/ui` and `apps/web` theme provider patterns.
- Fast switching without page reloads.
- Minimal bundle overhead and fully compatible with SSR and hydration.

**Cons**:
- Requires updating hardcoded Tailwind background and text classes across pages.

### Option 2: Separate Theme Stylesheets or Route-based Theming

Maintain separate stylesheets or query parameters (`?theme=light`) per route.

**Pros**:
- Isolated styling rules per mode.

**Cons**:
- Severe code duplication, sluggish transitions, and poor maintainability.

## Decision

**Chosen option**: Option 1: Native CSS Variables with NextThemes and OpenPanel Event Dispatch.

The marketing website will use `next-themes` configured with `defaultTheme="system"`, `attribute="class"`, and `enableSystem`. All views will consume standard semantic CSS tokens. Whenever the theme changes, an OpenPanel event `theme_changed` is emitted.

## Feature design

**CSS Variables & Theme Tokens**:
- Light mode:
  - `--bg-main`: `#faf9f6` (warm chalk cream)
  - `--text-main`: `#002116` / `#121314` (deep obsidian / forest)
  - `--text-muted`: `#414844` / `#525866`
  - `--card-bg`: `rgba(255, 255, 255, 0.9)`
  - `--card-border`: `rgba(0, 33, 22, 0.08)`
  - `--header-bg`: `rgba(250, 249, 246, 0.85)`
- Dark mode:
  - `--bg-main`: `#121314` (Obsidian Void)
  - `--text-main`: `#e3e2e3`
  - `--text-muted`: `#c5c9ae`
  - `--card-bg`: `rgba(26, 29, 33, 0.7)`
  - `--card-border`: `rgba(255, 255, 255, 0.08)`
  - `--header-bg`: `rgba(18, 19, 20, 0.85)`

**OpenPanel Telemetry Schema**:
- Event: `theme_changed`
- Payload: `{ theme: 'light' | 'dark', source: 'header_toggle' }`

**Critical test scenarios**:
- Happy path: User loads site on system dark mode; site renders Obsidian Void theme. User clicks theme toggle in header; site switches to chalk cream light mode, and OpenPanel records `theme_changed`. Verifies **AC-1**, **AC-2**, **AC-4**.
- Route navigation: User navigates from `/` to `/sales`, `/inventory`, and `/pricing`; active theme persists seamlessly. Verifies **AC-2**, **AC-5**.
- Legacy route removal: Navigating to `/light` is cleanly purged and does not break routeTree generation. Verifies **AC-3**.

## Build plan

1. Update `ThemeProvider` to use `defaultTheme="system"` and `enableSystem`, satisfies **AC-1**.
2. Enhance `apps/site-next/src/styles/app.css` design tokens and glass panel variables, satisfies **AC-2**.
3. Remove `apps/site-next/src/routes/light.tsx` and prune footer links, satisfies **AC-3**.
4. Implement OpenPanel event dispatch in `Header.tsx` on theme toggle, satisfies **AC-4**.
5. Update `routes/index.tsx` and core routes to adapt flexibly to light and dark tokens, satisfies **AC-2**, **AC-5**.

## Consequences

**Positive**:
- Consistent design system across dark and light palettes.
- Automated system preference detection improves first-time visitor experience.
- Observability via OpenPanel provides direct visibility into user theme preferences.

**Negative / tradeoffs**:
- Slightly more CSS variables to maintain across components.

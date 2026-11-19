---
name: Scryme Kinetic Precision
colors:
  surface: '#121316'
  surface-dim: '#121316'
  surface-bright: '#38393c'
  surface-container-lowest: '#0d0e11'
  surface-container-low: '#1b1b1f'
  surface-container: '#1f1f23'
  surface-container-high: '#292a2d'
  surface-container-highest: '#343538'
  on-surface: '#e3e2e6'
  on-surface-variant: '#c6c5d5'
  inverse-surface: '#e3e2e6'
  inverse-on-surface: '#303034'
  outline: '#908f9e'
  outline-variant: '#454652'
  surface-tint: '#bdc2ff'
  primary: '#bdc2ff'
  on-primary: '#121f8b'
  primary-container: '#5e6ad2'
  on-primary-container: '#fdfaff'
  inverse-primary: '#4854bb'
  secondary: '#bdc2ff'
  on-secondary: '#1c2679'
  secondary-container: '#343e91'
  on-secondary-container: '#a7afff'
  tertiary: '#c5c5d5'
  on-tertiary: '#2e303c'
  tertiary-container: '#717381'
  on-tertiary-container: '#fdfaff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dfe0ff'
  primary-fixed-dim: '#bdc2ff'
  on-primary-fixed: '#000965'
  on-primary-fixed-variant: '#2e3aa2'
  secondary-fixed: '#dfe0ff'
  secondary-fixed-dim: '#bdc2ff'
  on-secondary-fixed: '#000964'
  on-secondary-fixed-variant: '#343e91'
  tertiary-fixed: '#e1e1f2'
  tertiary-fixed-dim: '#c5c5d5'
  on-tertiary-fixed: '#191b26'
  on-tertiary-fixed-variant: '#444653'
  background: '#121316'
  on-background: '#e3e2e6'
  surface-variant: '#343538'
  status-critical: '#ffb4ab'
  status-warning: '#e5a158'
  status-success: '#7fd1a4'
  status-info: '#bdc2ff'
  status-neutral: '#908f9e'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: -0.006em
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 19px
    letterSpacing: -0.005em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0em
  label-code:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: -0.01em
  label-kbd:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.02em
  label-badge:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.01em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 0.75rem
  gutter-desktop: 1rem
  margin: 1rem
  margin-desktop: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system is engineered for high-performance software practitioners, engineering leaders, and product operators who require zero-latency workflow execution. The aesthetic is rooted in dark-mode minimalism, technical precision, and keyboard-first ergonomics. It strips away ornamental distraction in favor of extreme clarity, structural discipline, and micro-interactions that feel immediate and mechanical.

The visual narrative balances deep obsidian and carbon surfaces with surgical borders, hairline dividers, and electric indigo/violet light accents. Surfaces do not feel heavy or muddy; instead, they simulate high-grade matte anodized hardware. Every layout prioritizes high information density without visual claustrophobia, offering instant scannability and fluid spatial orientation.

## Colors

The color source of truth is the front matter token map at the top of this file, mirrored into `app/globals.css` as Tailwind theme tokens. Use those tokens directly; do not add a second palette or raw hex values to app screens.

Semantic mapping:

- `bg-surface` for the canvas.
- `bg-surface-container` for panels and inputs.
- `text-on-surface` for primary text.
- `text-outline` for muted text.
- `border-outline-variant` for dividers.
- `bg-primary-container` with `text-on-primary-container` for primary actions.
- `text-error` for errors.
- `status-critical`, `status-warning`, `status-success`, `status-info`, and `status-neutral` for status indicators.
- A 2px `primary` focus ring with a soft halo for focus.
- Reduced opacity and no pointer events for disabled controls.

## Typography

Typography delivers dense, razor-sharp scannability across multi-tier issue lists, detail sheets, and cycle boards. 

`Inter` handles all display headings, dense interface copy, and structural context. Dynamic letter-spacing tightens display headers to eliminate optical looseness.

`JetBrains Mono` serves as the primary technical anchor. It is applied systematically to:
- Issue identifiers (e.g., `SCR-1049`).
- Shortcut cues and command shortcuts (`⌘K`, `G then I`).
- Git commit hashes, branch indicators, and timestamp values.

All numbers in data-heavy columns must use tabular figures (`font-feature-settings: "tnum" 1`) to ensure perfect vertical alignment across high-frequency lists.

## Layout & Spacing

The layout is built on a high-density, screen-optimized spatial grid. Rather than spacious marketing-centric margins, this design system operates on compact increments optimized for data visibility and quick navigation.

### Viewport Shell Architecture
- **Sidebar Rail (Global Navigation):** Fixed width of 240px; collapsible to a 56px icon-only rail.
- **Master-Detail Layout:** Split view with dynamic master list width (380px–480px) and fluid detail canvas.
- **Board View:** Horizontally scrollable canvas with uniform 304px column lanes separated by 12px gaps.

### Responsive Breakpoints
- **Mobile (< 768px):** Single-pane sequential navigation. Drawers and panels open as full-screen sliding surfaces. Margins compress to `1rem` (`space-lg`).
- **Tablet (768px - 1024px):** Sidebar converts to an off-canvas overlay triggered via keyboard shortcut or gesture. Detail views present as modal sheets.
- **Desktop (> 1024px):** Three-tier layout (Navigation Rail, Workspace List/Board, Inspector Panel) operating side-by-side with zero lateral reflow jump.

## Elevation & Depth

Visual depth is achieved through high-contrast boundary definition and tonal shifting rather than heavy blur-drop shadows.

### Elevation Hierarchy
1. **Canvas (`#0D0E11`):** Ground plane. Zero elevation. Flat.
2. **Structural Panels (`#12141A`):** Anchored using single-pixel `border-subtle` borders without box-shadows.
3. **Interactive Cards (`#171922`):** Surrounded by a `#2E3039` border. Under mouse hover, surfaces brighten to `#1E212D` and cast a subtle, directional inset glow: `box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.05)`.
4. **Command Palette & Dropdowns (`#171922`):** Positioned with high-contrast borders and an ambient dark halo: `box-shadow: 0 16px 40px -8px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.08)`.
5. **Focused Key Elements:** Receive an electrostatic indigo glow: `box-shadow: 0 0 0 1px #5E6AD2, 0 0 12px -2px rgba(94, 106, 210, 0.35)`.

## Shapes

The geometric identity relies on tight, sharp radii. Curves are kept minimal (4px–6px) to reinforce an instrument-grade aesthetic:
- **Base Components (Buttons, Inputs, Badges):** Exactly 4px (`rounded-sm`).
- **Cards, Panels, and Dialogs:** Exactly 6px (`rounded-md`).
- **Micro UI (Keyboard keycaps, status pips):** 3px–4px.
- **Pill overrides:** Strictly prohibited, except for circular status dots and user avatars.

## Components

### Buttons
- **Primary:** Solid `#5E6AD2` background, `#FFFFFF` text, 4px border-radius, height: 32px (compact: 28px). Hover transitions to `#717DE3` with subtle top hairline highlight `rgba(255,255,255,0.2)`.
- **Secondary / Ghost:** Transparent background, `1px solid #2E3039` border, `#D1D5DB` text. Hover shifts to `#1E212D` background and `#FFFFFF` text.
- **Keycap Hints:** Secondary buttons feature integrated right-aligned `<kbd>` elements rendered in `JetBrains Mono` with `#6B7280` text.

### Issue & List Rows
- **Dimensions:** Fixed height of 36px for dense issue view, 44px for standard view.
- **Separation:** Bottom border of `1px solid rgba(255, 255, 255, 0.04)`.
- **Hover/Selection:** Hover switches background to `#1E212D`. Active keyboard focus produces a 2px vertical left accent bar in `#5E6AD2`.

### Status Indicators & Chips
- **Status Badges:** Compact 20px height, 4px radius, inline-flex layout. Combines an 8px circular status icon or hollow ring with 11px `label-badge` text.
- **Backlog/Todo:** Neutral slate outlines with muted fills.
- **In Progress:** Hollow golden orange circular icon with partial segment fill.
- **Completed:** Fully filled indigo icon with central white tick mark.

### Form Inputs & Command Palette
- **Text Inputs:** Height: 32px. `#12141A` fill, `1px solid #2E3039` perimeter, 4px border-radius. Active focus swaps border to `#5E6AD2` accompanied by a 2px soft outer halo (`rgba(94, 106, 210, 0.2)`).
- **Command Palette (`⌘K`):** Width: 640px. Centered in top third of viewport. Obsidian backdrop (`#171922`), razor-thin border (`rgba(255, 255, 255, 0.1)`), sticky search input field with no border, and zero list flicker.

### Checkboxes
- **Dimensions:** 14px × 14px square, 3px border-radius.
- **States:** Default is `#171922` fill with `1px solid #3E4251`. Checked state changes to `#5E6AD2` fill with a sharp white checkmark glyph.
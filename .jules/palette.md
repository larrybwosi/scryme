## 2025-02-15 - [Discoverable Keyboard Shortcuts via Accessible Tooltips]
**Learning:** Adding custom styled tooltips to key interactive buttons that are bound to keyboard shortcuts dramatically increases keyboard discoverability and improves micro-UX. However, retaining native `title` attributes on buttons wrapped in custom Tooltips results in "double tooltips" (styled custom tooltip + native browser tooltip appearing simultaneously on hover), causing visual clutter.
**Action:** When wrapping interactive buttons with custom Radix/Shadcn Tooltips to display shortcuts, replace native `title` attributes with descriptive `aria-label` attributes to preserve complete screen reader accessibility without duplicate tooltip overlays.

## 2025-02-18 - [Accessible Icon-Only Collapsible Navigation Buttons]
**Learning:** Collapsible layout containers (like sidebars) often render layout-only or icon-only buttons/links when collapsed. Without explicit `aria-label` attributes on these collapsed controls, screen readers fail to recognize their purpose, significantly hindering keyboard navigation and non-visual user experience.
**Action:** Always verify that collapsible layout links and action buttons maintain identical, explicit `title` and `aria-label` attributes when in a collapsed icon-only state.

## 2025-02-19 - [Desktop Tooltips on Icon-Only Segmented and Toggle Controls]
**Learning:** Sighted desktop mouse users rely heavily on hover states and native tooltips (`title`) for quick, clear visual context of compact, abstract icon-only segmented controls (like increment/decrement and layout collapsers), especially when full textual labels are omitted. Combining matching `aria-label` (for screen readers) with descriptive `title` (for desktop hovers) ensures comprehensive multi-modal accessibility.
**Action:** When designing space-constrained icon-only buttons or layout adjustment controls, always supply consistent, identical `aria-label` and `title` attributes.

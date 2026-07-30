## 2025-02-15 - [Discoverable Keyboard Shortcuts via Accessible Tooltips]
**Learning:** Adding custom styled tooltips to key interactive buttons that are bound to keyboard shortcuts dramatically increases keyboard discoverability and improves micro-UX. However, retaining native `title` attributes on buttons wrapped in custom Tooltips results in "double tooltips" (styled custom tooltip + native browser tooltip appearing simultaneously on hover), causing visual clutter.
**Action:** When wrapping interactive buttons with custom Radix/Shadcn Tooltips to display shortcuts, replace native `title` attributes with descriptive `aria-label` attributes to preserve complete screen reader accessibility without duplicate tooltip overlays.

## 2025-02-18 - [Accessible Icon-Only Collapsible Navigation Buttons]
**Learning:** Collapsible layout containers (like sidebars) often render layout-only or icon-only buttons/links when collapsed. Without explicit `aria-label` attributes on these collapsed controls, screen readers fail to recognize their purpose, significantly hindering keyboard navigation and non-visual user experience.
**Action:** Always verify that collapsible layout links and action buttons maintain identical, explicit `title` and `aria-label` attributes when in a collapsed icon-only state.

## 2025-02-19 - [Desktop Tooltips on Icon-Only Segmented and Toggle Controls]
**Learning:** Sighted desktop mouse users rely onscreen hover states and native tooltips (`title`) for quick, clear visual context of compact, abstract icon-only segmented controls (like increment/decrement and layout collapsers), especially when full textual labels are omitted. Combining matching `aria-label` (for screen readers) with descriptive `title` (for desktop hovers) ensures comprehensive multi-modal accessibility.
**Action:** When designing space-constrained icon-only buttons or layout adjustment controls, always supply consistent, identical `aria-label` and `title` attributes.

## 2025-02-23 - [Synchronized Web Application Sidebar Accessibility]
**Learning:** Sidebar navigation containers in full web applications benefit greatly from synchronized accessibility controls. Specifically, collapse/expand toggle buttons and collapsed main navigation item buttons should present unified `aria-label` and conditional `title` attributes (enabling `title` strictly when collapsed to represent the hidden visual label) to provide a rich visual tooltip for desktop hovers while preserving clean, semantic screen-reader compatibility.
**Action:** Always verify sidebar navigation triggers maintain active `aria-label` attributes, and apply matching visual `title` triggers dynamically or conditionally based on container collapsed states.

## 2026-07-28 - [Accessible Canvas and Palette Controls in Workflow Editors]
**Learning:** Visual node-based workflow/campaign editors frequently contain complex toolbars, sidebar palettes, and properties panels loaded with compact, icon-only toggle and navigation controls. Sighted desktop users and screen reader users alike can easily get lost or confused without consistent accessibility features and tooltips on these controls.
**Action:** Always equip icon-only control buttons within editor canvases and inspectors with matching, explicit `aria-label` and visual `title` attributes, and ensure collapsible group headers in the side palettes clearly announce their interactive state using `aria-expanded`.

## 2026-07-28 - [Keyboard Visibility of Hover-Only Action Buttons]
**Learning:** Interactive action buttons that are hidden by default via hover-only classes (e.g., `opacity-0 group-hover:opacity-100`) become invisible focus traps for keyboard-only users who tab through the interface. Adding focus-within and focus-visible classes ensures they are rendered fully visible when they or their parents receive keyboard focus.
**Action:** Always complement hover-only visibility toggles (`group-hover:opacity-100`) with `group-focus-within:opacity-100` and `focus-visible:opacity-100` (or `focus-within:opacity-100`) to ensure full interactive visibility for keyboard-only or non-visual navigation.

## 2026-07-29 - [Inline-Editing Input Blur Race Condition and Revert Mechanics]
**Learning:** In inline-editing input fields, clicking on external action buttons (like Save/Cancel) normally triggers the input's `onBlur` handler before the button's `onClick` can fire, which often prematurely unmounts the editing state and swallows the button click. Additionally, direct state mutation during typing prevents the user from canceling or reverting changes gracefully.
**Action:** Always decouple active state from an edit buffer (e.g., using a `tempName` state) to support clean cancel/revert mechanics on `Escape` keypress or Cancel clicks. To prevent input `onBlur` from pre-empting button click handlers, use `onMouseDown={(e) => e.preventDefault()}` on the action buttons.

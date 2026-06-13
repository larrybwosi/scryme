## 2025-06-11 - [PageHeader Accessibility & Semantic Actions]
**Learning:** Icon-only buttons (Star for favorites, MoreHorizontal for options) lacked descriptive labels and tooltips, making them inaccessible to screen readers and unclear for mouse users. Additionally, using `onClick` with a string path for navigation is an anti-pattern that breaks standard browser behaviors (like middle-click to open in new tab).
**Action:** Always wrap icon-only buttons in `Tooltip` and provide `aria-label`. Use `asChild` with `Link` for navigation actions to preserve semantic HTML and browser native features.

## 2025-06-12 - [Recursive Tooltip Implementation & Provider Setup]
**Learning:** Shared UI components using Tooltips require `TooltipProvider` at the application root (e.g., `layout.tsx`). When nesting triggers (e.g., `TooltipTrigger` + `DropdownMenuTrigger`), both must use `asChild` to avoid redundant DOM elements and ensure proper event propagation.
**Action:** Verify `TooltipProvider` exists in the app's root layout when using Tooltip-enabled components. Use `asChild` on nested triggers: `<Tooltip><TooltipTrigger asChild><DropdownMenuTrigger asChild>...</DropdownMenuTrigger></TooltipTrigger>...</Tooltip>`.

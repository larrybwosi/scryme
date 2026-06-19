## 2025-06-11 - [PageHeader Accessibility & Semantic Actions]
**Learning:** Icon-only buttons (Star for favorites, MoreHorizontal for options) lacked descriptive labels and tooltips, making them inaccessible to screen readers and unclear for mouse users. Additionally, using `onClick` with a string path for navigation is an anti-pattern that breaks standard browser behaviors (like middle-click to open in new tab).
**Action:** Always wrap icon-only buttons in `Tooltip` and provide `aria-label`. Use `asChild` with `Link` for navigation actions to preserve semantic HTML and browser native features.

## 2025-06-12 - [Recursive Tooltip Implementation & Provider Setup]
**Learning:** Shared UI components using Tooltips require `TooltipProvider` at the application root (e.g., `layout.tsx`). When nesting triggers (e.g., `TooltipTrigger` + `DropdownMenuTrigger`), both must use `asChild` to avoid redundant DOM elements and ensure proper event propagation.
**Action:** Verify `TooltipProvider` exists in the app's root layout when using Tooltip-enabled components. Use `asChild` on nested triggers: `<Tooltip><TooltipTrigger asChild><DropdownMenuTrigger asChild>...</DropdownMenuTrigger></TooltipTrigger>...</Tooltip>`.
## 2025-06-12 - [Unified Sidebar Session Management]
**Learning:** The sidebar's logout action was represented by a static icon without any functional binding or accessibility features (no button wrapper, no aria-label, no tooltip). This left users unable to sign out from the main dashboard.
**Action:** Implement `handleLogout` using the `authClient.signOut` utility and ensure the logout trigger is a functional `button` wrapped in a `Tooltip` with a descriptive `aria-label`. For collapsed sidebars, place the logout action in the bottom utility section to ensure visibility.

## 2025-06-12 - [Component Nesting & Prop Forwarding for Tooltips]
**Learning:** When wrapping custom dialog/sheet components (like `UnitDialog`) in `TooltipTrigger asChild`, the custom component MUST forward props and refs to its internal trigger (`DialogTrigger`/`SheetTrigger`). Otherwise, event handlers (hover, click) are lost, breaking both the tooltip and the trigger.
**Action:** Always extend `React.ComponentPropsWithoutRef<typeof Trigger>` in custom dialog/sheet props and spread `props` onto the internal trigger. If the custom component is used directly as a trigger, ensure it can render the appropriate semantic element (e.g., `Button`).

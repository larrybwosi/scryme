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

## 2025-06-19 - [Accessible Destructive Actions with Feedback]
**Learning:** Using native `confirm()` for destructive actions is a missed opportunity for brand consistency and accessibility. Furthermore, users often experience "click uncertainty" during network requests if there is no immediate visual feedback (like a loading spinner) on the action button.
**Action:** Replace native confirmation dialogs with themed `AlertDialog` components. Always include a loading state (spinner + "Deleting...") in the confirmation button to provide immediate feedback for asynchronous operations.

## 2025-06-20 - [Standardized Form Feedback & Validation Visibility]
**Learning:** Forms lacked immediate feedback during submission, leading to "click uncertainty." Mandatory fields were also not visually distinguished from optional ones, increasing the cognitive load for users during data entry.
**Action:** Always include a loading spinner (e.g., `Loader2`) and descriptive state text (e.g., "Creating...") in submit buttons when `isSubmitting` is true. Mark required fields with a red asterisk (`<span className="text-red-500">*</span>`) in the label to provide clear visual cues.

## 2025-06-21 - [Standardized Department Management UX]
**Learning:** Department management components were lagging behind the standardized UX patterns used in other modules (like Locations), specifically relying on native `confirm()` and lacking accessibility features (Tooltips/aria-labels) for action buttons.
**Action:** Always replace native `confirm()` with themed `AlertDialog` and ensure icon-only buttons in tables have both `Tooltip` and `aria-label`. Include loading states in all destructive action confirmations.

## 2025-06-22 - [CRM Module Standardization & Async Deletion UX]
**Learning:** Native `window.confirm` in the CRM module created a disjointed experience compared to other apps in the monorepo. Lack of loading states during optimistic deletion could lead to race conditions or user confusion if the background request failed after the UI element was hidden.
**Action:** Standardize destructive actions with themed `AlertDialog`. Ensure `Loader2` feedback is present in the confirmation button and that state cleanups (closing dialog, resetting selection) occur in `finally` blocks to handle both success and error paths gracefully. Always wrap icon-only pagination and action triggers in `Tooltip` with `aria-label`.

## 2025-06-28 - [Standardized Deletion UX in Location Zones]
**Learning:** Using native `confirm()` for destructive actions felt disjointed from the rest of the application's design system. Additionally, the lack of a loading state during the asynchronous deletion process could lead to user uncertainty or double-clicks.
**Action:** Replace native `confirm()` with themed `AlertDialog`. Implement `isDeleting` state to show a `Loader2` spinner and disable action buttons during the deletion process to provide immediate, consistent feedback.

## 2025-06-29 - [Standardized Deletion UX in Driver Table]
**Learning:** The Driver Table was using native `confirm()` for destructive actions, which was inconsistent with the rest of the application's design system and lacked accessibility features. Additionally, there was no visual feedback during the asynchronous deletion process.
**Action:** Replace native `confirm()` with themed `AlertDialog`. Implement `isDeleting` state to show a `Loader2` spinner and disable action buttons during the deletion process. Wrap icon-only dropdown triggers in `Tooltip` and provide a descriptive `aria-label` for screen readers.

## 2025-06-30 - [Leveraging Shared Confirmation Providers in Bakery]
**Learning:** While implementing custom `AlertDialog` states provides full control, it often exceeds PR line limits and duplicates logic already present in shared providers. The Bakery app has a `DeleteConfirmationProvider` that encapsulates the `AlertDialog` logic into a simple async hook.
**Action:** Before implementing custom confirmation state, check for existing context-based confirmation providers (like `useDeleteConfirmation`). Use these to reduce boilerplate and keep PRs focused and under the line limit. Always add `aria-label` to icon-only triggers.

## 2025-06-30 - [Unified Destructive Actions & Loading Feedback in Web]
**Learning:** Native `confirm()` is inconsistent with the monorepo's design language and lacks built-in support for loading states. When a component has multiple destructive actions (e.g., Revoke and Delete), a single `AlertDialog` with dynamic content can maintain UX clarity while keeping the code DRY and within line limits.
**Action:** Replace `confirm()` with `AlertDialog`. Use `pendingAction` state to manage dynamic titles, descriptions, and action logic. Always include `Loader2` feedback in the `AlertDialogAction` button.

## 2025-07-08 - [Selection State Synchronization After Deletion]
**Learning:** When using `AlertDialog` for destructive actions that affect selected items, it's critical to synchronize the selection state immediately after a successful operation. Failing to clear or filter `selectedVariants` (or similar collection states) can lead to stale UI indicators (e.g., "Delete Selected (1)" still showing after the item was removed).
**Action:** Always filter or clear selection state in the `finally` or success block of a deletion operation: `setSelectedItems(prev => prev.filter(id => !deletedIds.includes(id)))`.

## 2026-07-08 - [Standardized Developer Settings UX]
**Learning:** Native `confirm()` in developer settings felt inconsistent and lacked asynchronous feedback. Icon-only actions for copying and deleting lacked accessibility features and tooltips.
**Action:** Replace native `confirm()` with themed `AlertDialog`. Include `Loader2` feedback in destructive action buttons. Wrap icon-only triggers in `Tooltip` and provide descriptive `aria-label` attributes.

## 2026-07-08 - [Standardized Deletion & Device Reset UX in Bakery]
**Learning:** Native `confirm()` and icon-only buttons without feedback or tooltips degrade the terminal experience. Standardizing on themed `AlertDialog` and `TooltipProvider` with `useDeleteConfirmation` ensures a consistent, accessible, and high-quality UI across the monorepo.
**Action:** Always wrap the application in `TooltipProvider` at the root. Replace native `confirm()` with `AlertDialog` and use `useDeleteConfirmation` for entity deletions to provide consistent visual feedback and loading states (`Loader2`).

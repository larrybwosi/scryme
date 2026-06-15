## 2025-06-11 - [PageHeader Accessibility & Semantic Actions]
**Learning:** Icon-only buttons (Star for favorites, MoreHorizontal for options) lacked descriptive labels and tooltips, making them inaccessible to screen readers and unclear for mouse users. Additionally, using `onClick` with a string path for navigation is an anti-pattern that breaks standard browser behaviors (like middle-click to open in new tab).
**Action:** Always wrap icon-only buttons in `Tooltip` and provide `aria-label`. Use `asChild` with `Link` for navigation actions to preserve semantic HTML and browser native features.

## 2025-06-12 - [Unified Sidebar Session Management]
**Learning:** The sidebar's logout action was represented by a static icon without any functional binding or accessibility features (no button wrapper, no aria-label, no tooltip). This left users unable to sign out from the main dashboard.
**Action:** Implement `handleLogout` using the `authClient.signOut` utility and ensure the logout trigger is a functional `button` wrapped in a `Tooltip` with a descriptive `aria-label`. For collapsed sidebars, place the logout action in the bottom utility section to ensure visibility.

# `@repo/ui`

The shared React component and design system library for Scryme applications. Built on top of [Radix UI](https://www.radix-ui.com/) accessible primitives and styled with [Tailwind CSS v4](https://tailwindcss.com/), it ensures consistent, high-fidelity, and accessible user experiences across all frontends (Web, CRM, Portal, POS, and Bakery apps).

## 🚀 Key Features

- **Accessible Radix Primitives**: Incorporates fully accessible inputs, dialogs, dropdowns, popovers, select, tabs, hover cards, and accordion wrappers.
- **Tailwind CSS v4 Integration**: Leverages highly optimized utility styles, container queries, and customized themes.
- **Rich Hardware Integrations**:
  - **Barcode Scanner Support**: Integrates native desktop barcode scanner key listeners (character intervals < 45ms), automatic keystroke buffering, input event cancellations, React internal value syncing, and blinking indicator widgets.
  - **Thermal Printing Prompts**: Embedded UI controls designed for physical printer integrations.
- **Next.js Transpilation**: Added to Next.js `transpilePackages` arrays across all client workspaces to enable optimized runtime treeshaking and CSS compilation.

---

## 🛠️ Usage

To import components in your React frontend applications:

```typescript
import { Button, Input, Dialog } from "@repo/ui";
```

# `@repo/scryme`

The official client wrapper for interfacing with the **Scryme Chat API** (V3 & V2 fallback endpoints). It encapsulates authentication token negotiation, interactive webhook registrations, workspace provisions, message postings, and direct user resolutions.

## 🚀 Key Features

- **Seamless Client Credentials Exchange**: Automates OAuth2 token negotiation (`SCRYME_CHAT_CLIENT_ID` and `SCRYME_CHAT_CLIENT_SECRET`) with background auto-refresh buffers.
- **Workspace & Channel Management**: Provision high-level workspace nodes, list active text channels, and dynamically cache slugs to prevent redundant lookups.
- **Rich Message Dispatch**: Post structured markdown messages, attachment buffers, and interactive buttons/actions directly into collaborative threads.
- **Webhook Provisioning**: Supports programmatic workspace-level and global-level callback registry to receive instant action updates on interactive triggers.

---

## 🛠️ Quick Start

```typescript
import { ScrymeChatApiClient } from "@repo/scryme";

const client = new ScrymeChatApiClient(
  "https://api.scryme.tech",
  "client_id_here",
  "client_secret_here"
);

// Publish an interactive message to a channel slug
await client.sendMessage("scryme-hq", "general-channel", {
  content: "🚀 System Update: Inventory reconciliation completed successfully.",
  actions: [
    {
      id: "view-report-01",
      label: "View Report",
      type: "button",
      style: "primary",
      value: "rep_reconcile_992"
    }
  ]
});
```

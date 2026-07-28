# `@repo/notifications`

The shared messaging and notification delivery engine for the Scryme ERP platform. It supports email notifications, template compiling, SMS processing, and push alerts to ensure continuous contact with staff, managers, and clients.

## 🚀 Key Features

- **Multi-Channel Delivery**:
  - **Email Service**: Uses [Nodemailer](https://nodemailer.com/) as the underlying delivery framework.
  - **Sms Service**: Integrates with local SMS gateways and providers.
- **Dynamic Handlebars Templates**: Employs Handlebars to compile complex HTML email bodies, purchase receipt templates, account invitations, and transaction alerts.
- **Configurable Workflows**: Enables decoupled notification queue processors to scale up sending volume without degrading API response times.

---

## 🛠️ Usage

```typescript
import { EmailService } from "@repo/notifications/server";

const emailService = new EmailService();
await emailService.sendMail({
  to: "client@example.com",
  subject: "Your Scryme Invoice",
  template: "invoice-received",
  context: { invoiceId: "INV-2026-001", amount: "KSH 15,200" }
});
```

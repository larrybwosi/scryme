# 0027 · Meta WhatsApp Cloud API and Callbacks Modernization

**Status**: Accepted
**Date**: 2026-11-04
**Author**: Jules

## Context

The Scryme platform utilizes Meta WhatsApp Cloud API (v23.0) for CRM communications, customer relationship workflows, purchase order dispatches, and automated notifications. Prior implementations provided basic outbound text/template sending and simple text inbound ingestion. However, production deployments require up-to-date Meta Cloud API features, secure cryptographic callback verification (`X-Hub-Signature-256`), real-time delivery status callbacks (`sent`, `delivered`, `read`, `failed`), rich media support (documents, images, voice notes), interactive messages, automated business notifications (payment receipts, shipping/delivery status updates), and auto-reply workflows (welcome greetings, out-of-office autoreplies).

## Requirements

1. **AC-1 (Webhook Verification & Cryptographic HMAC Security)**: Webhook endpoints must support dynamic token challenge verification and validate incoming payloads against `X-Hub-Signature-256` using the organization's Meta App Secret.
2. **AC-2 (Delivery Status Callbacks)**: Parse and process Meta status updates (`sent`, `delivered`, `read`, `failed`) to update `CommunicationMessage` status and error metadata in real-time.
3. **AC-3 (Inbound & Outbound Media & Interactive Messages)**: Parse inbound media (image, audio, document, location, interactive button responses) and support outbound media attachments (PDFs, images) and interactive list/button payloads.
4. **AC-4 (Automated CRM Triggers)**:
   - Provide `sendPaymentReceiptNotification` with transaction ID, currency, amount, and receipt link.
   - Provide `sendDeliveryStatusNotification` with tracking number, status, delivery date, and courier details.
   - Support automated welcome / greeting autoreplies for new incoming threads.
   - Support out-of-office autoreplies based on business hours or integration settings.
5. **AC-5 (Developer & Admin Settings UI)**: Display turnkey Webhook Callback URL, verify token, and app secret configuration in `apps/crm/app/settings/integrations/whatsapp`, with auto-reply configuration toggles.
6. **AC-6 (CRM Communication UI Enhancements)**: Display delivery statuses (single/double ticks for sent, delivered, read, and red badge for failed) and render media attachments.

## Data Model & Configuration

`OrganizationIntegration.credentials` stores:
- `phoneNumberId`: string
- `accessToken`: string
- `wabaId`: string?
- `appSecret`: string? (for HMAC-SHA256 signature verification)
- `verifyToken`: string? (custom or auto-generated verification token)
- `displayPhoneNumber`: string?

`OrganizationIntegration.settings` stores:
- `enableWelcomeReply`: boolean
- `welcomeMessage`: string?
- `enableOutOfOfficeReply`: boolean
- `outOfOfficeMessage`: string?

`CommunicationMessage.metadata` records:
- `mediaType`: "image" | "document" | "audio" | "location" | "interactive"
- `mediaUrl`: string?
- `caption`: string?
- `interactiveType`: string?
- `error`: object? (Meta error code and message on failure callbacks)

## API Surface

- `GET /webhooks/whatsapp`: Webhook challenge verification with verify token checking.
- `POST /webhooks/whatsapp`: Webhook receiver processing messages and status updates with HMAC validation.
- `POST :orgSlug/crm/communication/send`: Send text, template, media, or interactive WhatsApp message.
- `POST :orgSlug/crm/communication/whatsapp/send-payment-receipt`: Send payment receipt notification.
- `POST :orgSlug/crm/communication/whatsapp/send-delivery-status`: Send fulfillment / delivery status update.
- `GET :orgSlug/crm/communication/whatsapp/config`: Retrieve connection status, credentials, and settings.
- `POST :orgSlug/crm/communication/whatsapp/config`: Update credentials and automation settings.
- `POST :orgSlug/crm/communication/templates/sync`: Sync templates from Meta Graph API.

## Build Plan

1. Update `apps/api/src/v3/modules/crm-integrations`:
   - Cryptographic verification helper & status callback parsing in `WhatsappCloudApiProvider`.
   - Message status updating, media handling, and autoreply logic in `WhatsappService`.
   - Payment receipt and delivery status endpoints in `WhatsappCrmController` and `WhatsappPublicWebhookController`.
2. Update `apps/crm/app/actions/whatsapp.ts`:
   - Expose actions for webhook config details, auto-reply settings, and payment/delivery message dispatching.
3. Update `apps/crm/app/settings/integrations/whatsapp/page.tsx`:
   - Turnkey webhook setup card with copyable URL & verify token, app secret input, and automated reply settings.
4. Update `apps/crm/app/communications/page.tsx`:
   - Support rendering media attachments and real-time delivery status indicators.
5. Unit and integration tests covering callbacks, media parsing, and notifications.

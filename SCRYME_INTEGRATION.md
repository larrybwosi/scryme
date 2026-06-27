# Scryme Chat Integration Guide

This document details the integration standards for Scryme Chat with the Dealio ecosystem.

## 1. Webhook Signature Verification

To ensure security, all incoming webhooks from Scryme Chat to Dealio's API (`/v2/scryme/webhook`) must be signed.

**Header:** `x-scryme-signature`
**Algorithm:** HMAC-SHA256
**Content:** Hexadecimal representation of the HMAC of the raw JSON body.

### Example Implementation (Scryme API side)

```javascript
const crypto = require("crypto");

function signPayload(payload, secret) {
  return crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(payload))
    .digest("hex");
}
```

## 2. Webhook Payload Structures

### Interactive Message Action (`message.action`)

Sent when a user clicks a button in Scryme Chat.

```json
{
  "event": "message.action",
  "timestamp": "2023-10-27T10:00:00Z",
  "data": {
    "workspaceSlug": "org-dealio",
    "channelSlug": "notifications",
    "user": {
      "id": "user_123",
      "name": "John Doe"
    },
    "message": {
      "id": "msg_456",
      "content": "New approval request"
    },
    "action": {
      "id": "approve_request",
      "value": "request_789"
    }
  }
}
```

## 3. Provisioning Standard

Organizations are provisioned with a workspace slug format: `org-{organization_slug}`.

**Base URL:** `https://api.scryme.app`
**Auth:** OAuth2 Client Credentials (v2)

### M2M Endpoints

- `POST /api/v2/m2m/workspaces`: Create workspace
- `GET /api/v2/m2m/workspaces/:slug`: Get workspace
- `POST /api/v2/m2m/workspaces/:slug/channels/:channel/messages`: Send message
- `POST /api/v2/m2m/webhooks`: Register global webhook

## 4. Environment Variables

| Variable                      | Description                                                                   |
| ----------------------------- | ----------------------------------------------------------------------------- |
| `SCRYME_CHAT_API_URL`         | Base URL for Scryme API                                                       |
| `SCRYME_CHAT_CLIENT_ID`       | Global M2M Client ID                                                          |
| `SCRYME_CHAT_CLIENT_SECRET`   | Global M2M Client Secret                                                      |
| `SCRYME_WEBHOOK_SECRET`       | Secret used to sign/verify webhooks                                           |
| `SCRYME_ACTION_WORKFLOW_PATH` | Windmill path for action handling (default: `f/dealio/scryme_action_handler`) |
| `PUBLIC_API_URL`              | Used for auto-registering the webhook on startup                              |

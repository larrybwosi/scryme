# 0046. Customermates two way integration, rationale

## Context

> ⚠️ Premise note: This request spans four independently implementable decisions: connection and credential setup, inbound sync, outbound write back, and the settings and record screens. This spec covers the two way sync contract end to end and keeps the screens thin, and a separate spec is recommended if the schema editor or message composer grows. Last write wins can drop a close edit from one side; this spec adds version checks and a retained payload log so the loss is visible, but a field level merge would be safer if losing an edit is unacceptable. The design assumes the existing auth model, organization isolation, integration framework and telemetry, none of which have a dedicated spec in this repo.

Scryme already has customer, CRM, communication and integration models, a signed webhook pattern for WhatsApp, a worker setup with BullMQ, and telemetry standards. Customermates is an outside CRM with a REST API, outgoing webhooks and an MCP endpoint. Your team wants one customer view that reflects their records and edits that flow back, across contacts, organizations, deals, activities and messages.

The work has to fit a multi tenant system. One organization cannot read another organization's key, mapping or records. A webhook arrives from an outside system with no user session, so the route must identify the organization from the URL and prove the delivery with a signature. Their deliveries have a five second timeout and can arrive out of order, so the endpoint has to answer quickly and the worker has to decide which value is newer. Their API answers 429 when busy and uses a schema revision to guard writes, so retries and stale field ids are part of the design rather than edge cases.

Personal data moves through this integration, including names, email addresses, phone numbers and message text. No named regulatory standard was supplied, but the storage, logs and retention still need to be deliberate. The chosen direction also means an organization can keep a working connection without a deploy, which pushes credential storage into the database with encryption instead of a shared environment variable.

## Options considered

### Option 1: Dedicated adapter with two way sync (chosen)

Build a small typed client and mapper package for Customermates, use the existing CRM integration module for the webhook and jobs, and store encrypted credentials per organization. Webhooks and a backfill bring records into Scryme, and the existing update paths push three fields back. (basis: `AGENTS.md` stack and conventions, `apps/api/src/v3/modules/crm-integrations`, existing BullMQ worker setup, Customermates REST and webhook docs)

**Pros**:
- Fits the existing module and worker setup, so there is no new service to operate.
- Per organization credentials and mappings keep tenant data separate.
- A typed client limits the surface to the routes actually used, which is easy to test and pin to a schema revision.

**Cons**:
- Two way sync brings conflict handling, out of order events and schema drift into the build.
- A new package adds workspace configuration and build entries.

### Option 2: Generic integration framework only

Use the existing generic incoming webhook receiver and `ExternalMapping` table without Customermates specific code, and map payloads through configuration. (basis: `apps/api/src/v3/modules/webhooks`, `ExternalMapping` in `packages/db/prisma/schema/intergrations.prisma`)

**Pros**:
- Least new code, and any future connector could reuse the same path.
- No Customermates specific package to maintain.

**Cons**:
- The generic receiver has no event id dedupe today, so out of order or repeated deliveries would need new plumbing anyway.
- Customermates uses typed field ids, record references and a schema revision that do not fit a generic payload mapper without hidden special cases.
- Debugging a failed delivery is harder when parsing lives in configuration rather than a tested mapper.

### Option 3: Expose Customermates through MCP instead of syncing records

Point AI clients at the Customermates MCP endpoint and skip the two way sync. (basis: Customermates MCP docs, `packages/mcp-server`, `docs/mcp-integration-guide.md`)

**Pros**:
- Many ready made tools with no client code to write.
- No local copy of customer data, so no conflict or backfill problem.

**Cons**:
- Only helps users with an AI client, not the rest of the team.
- Does not give Scryme a customer view, which is the outcome you asked for.
- Still needs credential management and permission decisions.

### Option 4: Keep the integration outside the repo in n8n

Run the flows in a separately hosted automation tool with webhooks and HTTP nodes. (basis: Customermates integrations docs, `integrations/hermes-agent` as the existing external adapter precedent)

**Pros**:
- No code change in Scryme, and flow changes are quick.
- The automation tool handles scheduling and retries.

**Cons**:
- Credentials and mappings live outside your system, which weakens tenant isolation and audit.
- Scryme still needs an API surface for writes, so the work is moved rather than removed.
- Debugging spans two platforms with different logs.

## Rationale

The deciding force is the existing shape of Scryme. You already have per organization integrations, encryption helpers, a signed webhook pattern, a worker and customer screens that people use. Option 1 stays inside that shape and keeps the Customermates specific knowledge in one testable package. Option 2 looks cheaper but the generic receiver lacks dedupe and the Customermates field ids need real parsing code, so the saving is small and the debugging cost is higher. Option 3 solves a different problem, and Option 4 moves credentials out of the tenant boundary that this system already enforces. (basis: `AGENTS.md`, `apps/api/src/v3/modules/crm-integrations`, `packages/shared/src/api/v3/encryption.ts`)

You chose two way sync and last write wins rather than a field level merge. That is a real tradeoff. A merge would preserve more edits but would need a review surface and more state. The chosen design reduces the risk by comparing record version and timestamp, refusing writes with a stale schema revision, and keeping the raw payload for 30 days. You should accept that two close edits to the same field can still lose one. (basis: idempotency keys for external side effects, event id deduplication for at least once delivery)

Per organization credentials make database storage unavoidable, even though the usual rule in the feature guidelines is to keep secrets out of the database. The repo already documents encrypted `OrganizationIntegration.credentials`, and the encryption helper derives its key from `ENCRYPTION_KEY`. The safer form here is encrypted values with a dedicated low privilege Customermates user, because Customermates keys inherit the owner's role and cannot be limited per key. (basis: `packages/db/prisma/schema/intergrations.prisma`, `packages/shared/src/api/v3/encryption.ts`, Customermates API key docs)

The five second webhook timeout and the possibility of reversed delivery order drive the fast acknowledgement and the record state table. The endpoint only verifies the signature, deduplicates the event and enqueues work. The worker decides whether the incoming value is newer, then applies it. Nightly reconciliation catches deliveries that never arrived. (basis: Customermates webhook docs, existing WhatsApp webhook service in `apps/api`)

## References

**Project sources** (verifiable, in this repo):
- `AGENTS.md`: stack, build approach Skateboard and spec conventions
- `apps/api/src/v3/modules/crm-integrations`: signed WhatsApp webhook service and provider pattern
- `apps/api/src/v3/modules/webhooks`: generic incoming webhook receiver and delivery log
- `packages/db/prisma/schema/intergrations.prisma`: `OrganizationIntegration`, `ExternalMapping` and `IntegrationEvent`
- `packages/db/prisma/schema/crm.prisma`: CRM records, activities and communication models
- `packages/shared/src/api/v3/encryption.ts`: encryption helper for stored credentials
- `docs/specs/0030-enterprise-telemetry-and-observability.md`: telemetry conventions
- `docs/v3-connected-apps-catalog.md`: existing connected apps context

**Practices & standards**:
- Idempotency keys for external side effects
- Constant time HMAC verification over the raw request body
- Event id deduplication for at least once delivery
- Bounded pagination with resumable checkpoints
- Retry with Retry-After and capped exponential backoff
- Least privilege credentials for external API keys

**Links** (web verified on 2026-11-20):
- Customermates REST API and OpenAPI: https://customermates.com/en/features/api
- Customermates API keys and permissions: https://customermates.com/en/docs/api-keys
- Customermates webhooks, signatures, retries and ordering: https://customermates.com/en/docs/webhooks
- Customermates record mutate contract: https://customermates.com/en/docs/openapi/mutateRecord
- Customermates MCP endpoint: https://customermates.com/en/docs/mcp
- Customermates documentation home: https://customermates.com/en/docs

### Landscape scan

The official pages now describe 20 selectable webhook events and 64 MCP tools. Older snippets mentioning 16 events and 59 tools are stale. Record writes are POST actions under `/api/v1`, with `expectedRevision`, `expectedVersion` and `idempotencyKey` on `records mutate`. Webhook signatures are lowercase hex HMAC SHA256 in `X-Webhook-Signature` over the raw body, with a five second delivery timeout and retries up to ten attempts on timeouts, network errors, 5xx and 408, 425 or 429. Deliveries are not ordered, so dedupe by event id and order by timestamp and record version.

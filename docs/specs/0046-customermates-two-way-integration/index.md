# 0046. Customermates two way integration

**Date**: 2026-11-20
**Status**: In Progress

## Summary

You will connect the Customermates CRM to Scryme so customer records stay current in both systems. Customermates pushes changes to a signed webhook, Scryme stores them in the customer and CRM screens you already use, and edits in Scryme flow back through a small typed client. The design reuses your existing integration, worker and telemetry code, adds one small table for record versions, and keeps credentials encrypted per organization. The main tradeoff is that both systems can change the same field, so the newer timestamp wins and a close edit from the other side can be lost, with the raw payload kept so the loss can be traced.

## Requirements

**User stories**:
- As an organization admin, I want to connect our Customermates workspace once so every member sees current customer records.
- As a staff member, I want edits I make to a customer in Scryme to appear in Customermates so I do not enter data twice.
- As a staff member, I want deals, activities and messages on the customer record so I can work without switching systems.
- As an admin, I want a clear sync status and failed events so I can tell whether data is current.

**Acceptance criteria** (the contract, each independently checkable):
- **AC-1**: An admin can connect one Customermates workspace per organization by giving an https base URL, an API key and a webhook secret. Connection succeeds only when `model discover` and `model read` return at least one list of each chosen type and a schema revision. The API stores encrypted credentials, discovered list ids and field ids, and rejects private or link local hosts before sending the key.
- **AC-2**: Connecting starts a resumable backfill of contacts, organizations, deals and message threads in pages of at most 100 records. The cursor stores list type id, page number and last record id in `OrganizationIntegration.settings` and checkpoints after each committed page. The integration reaches synced when every selected list has reached its final page, no item is pending and `lastSyncAt` is set.
- **AC-3**: A signed contact or organization event creates or updates the matching `Customer` or `BusinessAccount`, matched by email inside the organization, and writes an `ExternalMapping` and a `CustomermatesRecordState` row.
- **AC-4**: A signed deal event creates or updates a Deals `CrmRecord`, links it to the matched customer or company with a `CrmAssociation`, and records a `CrmActivity` with the change.
- **AC-5**: A signed message event creates or updates a `CommunicationThread` and `CommunicationMessage` with its external id. A second delivery with the same event id changes nothing.
- **AC-6**: A change made through the Scryme update path enqueues a write back that sends only the changed fields among name, email and phone, with the idempotency key frozen at enqueue. The response version is written back to `CustomermatesRecordState` so the next edit carries the current expected version.
- **AC-7**: When both sides changed a record, the newer value wins. Compare record version first, then compare the remote timestamp with `CustomermatesRecordState.lastSyncedAt` when no version exists. Treat a tie as incoming loses, and treat a remote timestamp more than five minutes ahead of our receipt time as skewed, logging it and using the receipt time. An older delivery never overwrites a newer local value.
- **AC-8**: A missing or invalid webhook signature returns an error and writes no record, mapping or event state.
- **AC-9**: A 429 response from Customermates is retried using its Retry-After value with capped backoff. After the retry cap the job fails and the integration shows an error status.
- **AC-10**: A schema revision mismatch fails the job, marks the integration in error and prevents any write with stale field ids.
- **AC-11**: One failed message, activity or backfill page is marked failed and retried without blocking other records in the batch.
- **AC-12**: Only organization admins with the existing integration permission can connect, refresh schema, start a backfill or disconnect. Other members receive a forbidden response.
- **AC-13**: Disconnect stops sync and keeps records and mappings. Reconnecting resumes without creating duplicate `Customer` or `BusinessAccount` rows.
- **AC-14**: Every log line carries the organization id and event id, sync status is visible in the settings screen, and failure counters are emitted.
- **AC-15**: Raw webhook payloads older than 30 days are cleared, while the `IntegrationEvent` row keeps its event id, status and timestamps as the dedupe ledger.
- **AC-16**: A nightly job rereads active records from Customermates and applies changes that no webhook delivered, without creating duplicate `Customer` or `BusinessAccount` rows.
- **AC-17**: An admin can retry failed items, list failed items and rotate the webhook secret. During rotation both the old and new secret verify deliveries for 24 hours, and the error status clears only after a successful retry.

## Decision

**Chosen option**: Option 1 in `rationale.md`, a dedicated Customermates adapter with two way sync.

Build a new `@repo/customermates` package for the typed REST client, field mappers and signature check. Put the webhook route, jobs and use cases in the existing CRM integrations module of `apps/api`. Store one credential set per organization, encrypted with the encryption helper already in the repo. (basis: `AGENTS.md` stack and conventions, the existing `apps/api/src/v3/modules/crm-integrations` module, the existing BullMQ worker setup)

## Feature design

**Data model sketch**:

| Entity | Key | Fields and rules | Link |
| --- | --- | --- | --- |
| `IntegrationDefinition` | `id` | One seeded row, name Customermates, category CRM, auth type API key | Many `OrganizationIntegration` rows |
| `OrganizationIntegration` | `id`, unique on organization plus definition | Encrypted `credentials` with base URL, API key and webhook secret. `settings` with list ids, field ids and schema revision. `syncStatus`, `syncMessage`, `lastSyncAt` | Belongs to `Organization` |
| `ExternalMapping` | `id`, unique on organization, provider, external id and entity type | `internalEntityType`, `internalId`, `externalId`, `entityType`, `provider` set to CUSTOMERMATES, `externalData` with raw external values | Points to `Customer`, `BusinessAccount`, `CrmRecord` or message rows |
| `CustomermatesRecordState` new | `id`, unique on organization, type id and record id | `organizationIntegrationId`, `typeId`, `recordId`, `externalVersion`, `lastChangedAt`, `lastSyncedAt`, processing state | Belongs to `Organization` and its integration |
| `IntegrationEvent` | `id` | Add `externalEventId` with a unique rule per integration. Keep `payload`, `status`, `processingError`, `receivedAt`, `processedAt`. Clear `payload` after 30 days and keep the row as the dedupe ledger | Belongs to `OrganizationIntegration` |
| `Customer` | `id`, unique on organization plus email | `name` from first and last name, `email`, `phone` | One mapping row, many deals |
| `BusinessAccount` | `id` | `name`, `website`, `taxId` from an organization record | One mapping row, many contacts and deals |
| `CrmObjectDefinition` | `id`, unique on organization plus name | One seeded Deals object per organization | Many `CrmRecord` rows |
| `CrmRecord` | `id`, no unique rule on organization plus object | Each deal in `data` JSON, matched to Customermates through `ExternalMapping`. `CrmActivity.metadata` holds before and after values | Deals link to a `Customer` or `BusinessAccount` through `CrmAssociation`. A link to a customer that has not arrived yet stays as a pending marker in `ExternalMapping.externalData` |
| `CrmActivity` | `id` | Update events on a deal, with a metadata diff | Belongs to a `CrmRecord` |
| `CommunicationThread` and `CommunicationMessage` | `id`, message external id unique | Threads use `participantPhone` as the participant identifier with channel EMAIL or OTHER. Messages carry direction, content, status and external id | Thread links to a `CrmRecord` when a customer match exists |

The migration adds `CustomermatesRecordState`, the `externalEventId` column and its unique rule, and the IntegrationDefinition seed row. No other table changes.

**Event mapping**:

| Event or body marker | Action |
| --- | --- |
| `record.created`, `record.updated` on a list marked as contact or organization | Create or update `Customer` or `BusinessAccount` |
| `record.created`, `record.updated` on a list marked as deal | Create or update a Deals `CrmRecord` and its activity |
| Messaging events whose payload carries a thread and a message identifier | Create or update `CommunicationThread` and `CommunicationMessage` |
| `record.deleted`, `record.restored`, `record.deletedPermanently`, form, booking, incoming webhook and automation events | Record the event and skip application, because deletes are out of scope |
| Any other event | Record the event as skipped and log the event type |

Logical fields name, first name, last name, email, phone, organization name, deal stage and message content bind to field ids stored in `OrganizationIntegration.settings`. An unmapped field is skipped and logged. The list type id in the payload selects which binding to use.

**State transitions**:

`OrganizationIntegration.syncStatus`: not connected to connecting to syncing to synced to error. An error state accepts webhook deliveries and records them as pending, but applies nothing until an admin refreshes the schema and retries failed items. A successful retry returns the row to synced. Disconnect moves the row to not connected and keeps all mappings and records.

`CustomermatesRecordState` processing state: pending to applied, or pending to skipped when the incoming value is older, or pending to failed. A failed state returns to pending on retry.

A backfill cursor lives in `OrganizationIntegration.settings` as list type id, page number and last record id. Each page commits before the cursor moves. Inbound events that arrive during a backfill are queued and applied after the page for that record finishes, so a stale backfill page cannot overwrite a fresher webhook value.

A nightly job rereads active records from each connected workspace and applies changes that no webhook delivered. It uses the same mapper and record state as webhook work, so it cannot create a duplicate `Customer` or `BusinessAccount`.

**API surface**:

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
| --- | --- | --- | --- | --- | --- |
| `/v3/:orgSlug/integrations/customermates` | POST | `baseUrl:string` required, `apiKey:string` required, `webhookSecret:string` required | `id`, `status`, discovered list ids and field ids, schema revision | Org admin with integration permission | 401 invalid key, 409 already connected, 422 unsafe or unreachable URL |
| `/v3/:orgSlug/integrations/customermates` | GET | none | `syncStatus`, `syncMessage`, `lastSyncAt`, schema revision, event counts | Org admin with integration permission | 404 not connected |
| `/v3/:orgSlug/integrations/customermates/refresh-schema` | POST | none | new schema revision, count of pending events requeued | Org admin with integration permission | 502 upstream failure, 409 sync in progress |
| `/v3/:orgSlug/integrations/customermates/backfill` | POST | `resume:boolean` optional | `jobId` | Org admin with integration permission | 409 sync in progress, 404 not connected |
| `/v3/:orgSlug/integrations/customermates/failed` | GET | none | failed event ids, errors and record state | Org admin with integration permission | 404 not connected |
| `/v3/:orgSlug/integrations/customermates/failed/retry` | POST | `eventIds:string[]` optional | `jobId` | Org admin with integration permission | 409 sync in progress, 404 not connected |
| `/v3/:orgSlug/integrations/customermates/rotate-secret` | POST | `webhookSecret:string` required | active secret and previous secret expiry | Org admin with integration permission | 422 weak secret, 404 not connected |
| `/v3/:orgSlug/integrations/customermates` | DELETE | none | `status` not connected | Org admin with integration permission | 404 not connected |
| `/webhooks/customermates/:orgSlug` | POST | raw JSON body, `X-Webhook-Signature` header | `200` after dedupe, `401` on bad signature | HMAC secret from encrypted credentials, old and new during rotation | 401 bad signature, 400 bad JSON, 429 local rate limit |
| Existing customer and business account update paths | existing | existing update body | existing response | existing member permissions | 409 when integration is in error state |

**Value sourcing**:

| Action | Value produced or displayed | Source |
| --- | --- | --- |
| Connect | Organization id | Org slug in the route resolved by the v3 context guard |
| Connect | Base URL, API key, webhook secret | Three request inputs, encrypted before storage |
| Connect | URL safety decision | https scheme and host check performed before any request sends the key |
| Connect | Discovery success | A `model discover` and `model read` response with at least one list of each chosen type and a schema revision |
| Refresh schema | List ids, field ids, schema revision | `model discover` and `model read` responses stored in `OrganizationIntegration.settings` |
| Webhook receive | Event id | `id` in the webhook body, checked against `IntegrationEvent.externalEventId` |
| Webhook receive | Record type id and record id | Record reference in the webhook body |
| Webhook receive | Remote timestamp | Webhook `timestamp` and record version, falling back to system updated at from a `records read` call |
| Write back | Expected revision | Stored schema revision from `OrganizationIntegration.settings` |
| Write back | Expected version | `CustomermatesRecordState.externalVersion` |
| Write back | Idempotency key | Frozen at enqueue from integration id plus local record id and change time. Inbound work uses integration id plus event id |
| Write back | Fields to send | Changed fields among name, email and phone from the update body, mapped through stored field ids |
| Write back | First and last name | Stored field map splits `Customer.name`, falling back to a display name field when split fields are absent |
| Write back | Next expected version | Version in the `records mutate` response, written to `CustomermatesRecordState.externalVersion` |
| Conflict check | Inequality baseline | Remote version, otherwise remote timestamp compared with `CustomermatesRecordState.lastSyncedAt` and our receipt time |
| Contact match | Customer email uniqueness | Existing `@@unique([organizationId, email])` on `Customer` after trimming and lowercasing both sides |
| Contact match | Mapping first | `ExternalMapping` on organization, provider and external id, then email only for the first binding |
| Deal link | Customer or company for a deal | Relation field id from stored settings, resolved through `ExternalMapping` |
| Message sync | Participant identifier | Participant field in the webhook body, mapped through stored settings |
| Settings screen | Connected source badge | `ExternalMapping.provider` equals CUSTOMERMATES |
| Settings screen | Sync status and last sync time | `OrganizationIntegration.syncStatus` and `lastSyncAt` |
| Error handling | Signature secret | Decrypted `OrganizationIntegration.credentials.webhookSecret`, plus the previous secret for 24 hours after rotation |
| Error handling | Retry delay | `Retry-After` header from the 429 response, capped at 60 seconds, with five attempts total |
| Error handling | Failure counter | `customermates_event_failed_total` labelled by organization and event type |
| Retention job | Payload cutoff | Fixed 30 day rule in this spec, compared with `IntegrationEvent.receivedAt` |
| Retention job | Dedupe ledger | `IntegrationEvent.externalEventId` and record version kept after the payload is cleared |

**Key invariants**:

- Every external id is unique only inside one organization and one provider.
- One organization connects to one Customermates workspace, and every mapping and credential lookup is scoped to that organization.
- Connect accepts only https URLs and rejects private, loopback and link local hosts before sending the API key.
- No write happens with a stale schema revision.
- One event id is applied at most once per integration, with the ledger kept after payload cleanup.
- Matching checks `ExternalMapping` before email. A missing email creates a `Customer`, and several email matches mark the event failed.
- Compare record version before time. A tie loses, and a timestamp more than five minutes ahead of receipt is treated as skewed.
- An older remote version or timestamp never overwrites a newer local value.
- Trash, restore and permanent delete events are recorded but not applied. Deletes are out of scope.
- Outbound write back skips a record whose remote state is trashed and marks the item failed.
- Webhook deliveries during a backfill wait until the page for that record is committed.
- Our webhook route returns 200 after dedupe, so our own rate limits never reach their retry policy. Internal job retries do not send 429 to them.
- Credentials are encrypted at rest and never logged. A changed `ENCRYPTION_KEY` requires the admin to enter the key again.
- The webhook answers after dedupe, before slow work.
- Every external mutation carries an idempotency key frozen at enqueue.
- All queries filter by organization id.

**Security model**:

Organization admins with the existing integration permission manage the connection. Other members can read synced records through the usual customer and CRM permissions but cannot rotate credentials or trigger a backfill. The webhook route is public and verified by a lowercase hex HMAC SHA256 signature over the raw body with constant time comparison. Personal data is in scope, specifically contact names, email addresses, phone numbers and message content. Every webhook delivery is logged through `IntegrationEvent`, and structured logs carry organization id and event id. No named regulatory standard was given for this feature. Customermates API keys inherit the role of the user who created them and have no per key scopes, so the key must belong to a dedicated user with the minimum role that still allows REST reads and writes.

**Configuration required**:

- `ENCRYPTION_KEY`: existing server key used by the encryption helper to protect stored credentials. Confirm it is set in every environment. No new global environment variable is introduced.
- Prerequisite: a Customermates workspace on a plan that includes webhooks, or a self hosted workspace, plus a dedicated low privilege user whose API key can read and write the chosen lists.

**Critical test scenarios**:

- Happy path: connect a workspace, backfill a contact, change its email in Scryme, and see the update reach Customermates with the same idempotency key on retry, verifies **AC-1**, **AC-2**, **AC-3**, **AC-6**.
- Happy path: a deal webhook creates a `CrmRecord` linked to a customer and a message webhook creates a thread with one message, verifies **AC-4**, **AC-5**.
- Failure case: two out of order deliveries for one contact leave the newer value in place, and a duplicate event id changes nothing, verifies **AC-5**, **AC-7**.
- Failure case: invalid signature, 429 with Retry-After, stale schema revision and one bad item in a batch each fail without blocking unrelated records, verifies **AC-8**, **AC-9**, **AC-10**, **AC-11**.
- Failure case: an http URL or a private host is rejected before the key is sent, verifies **AC-1**.
- Failure case: a skewed timestamp and a tie follow the version and baseline rules, verifies **AC-7**.
- Failure case: an email match with two candidates is marked failed while other records still apply, verifies **AC-11**.
- Auth and permission: a regular member cannot connect or disconnect, and disconnect keeps records for a later reconnect, verifies **AC-12**, **AC-13**.
- Recovery: an admin lists failed items, retries one and rotates the webhook secret with both secrets accepted for 24 hours, verifies **AC-17**.
- Operations: a nightly run applies a missed change without duplicating a customer, verifies **AC-16**.
- Operations: logs carry organization and event ids, the settings screen shows status, payloads older than 30 days are cleared while the dedupe ledger stays, verifies **AC-14**, **AC-15**.

## Build plan

Ordered as Skateboard, the project default. The thinnest whole loop goes first, connect and sync one contact and write it back, then the remaining record types and hardening grow around it.

1. Migration: add `CustomermatesRecordState`, add `externalEventId` to `IntegrationEvent` with a unique rule per integration, and seed the Customermates `IntegrationDefinition`, satisfies **AC-1**, **AC-3**, **AC-5**, **AC-13**.
2. Create `@repo/customermates` with a typed axios client for `model discover`, `model read`, `records query`, `records read` and `records mutate`, plus HMAC verification and field mappers, satisfies **AC-1**, **AC-6**, **AC-8**.
3. Add `POST /webhooks/customermates/:orgSlug`, verify the signature, deduplicate by event id, persist `IntegrationEvent` and enqueue work, satisfies **AC-5**, **AC-8**, **AC-14**.
4. Build the connect, status, refresh schema, backfill, failed list, failed retry, rotate secret and disconnect endpoints with encrypted credentials, URL safety checks and org admin permission, satisfies **AC-1**, **AC-12**, **AC-13**, **AC-14**, **AC-17**.
5. Implement contact and organization sync with mapping first, normalized email binding, record state and version based comparison with skew handling, satisfies **AC-3**, **AC-7**.
6. Hook the existing update paths to enqueue partial write back for changed name, email and phone fields, with a frozen idempotency key and version feed back from the mutate response, satisfies **AC-6**, **AC-7**.
7. Add the resumable backfill worker with pages of 100 and per page checkpoints, satisfies **AC-2**, **AC-11**.
8. Implement deal sync into the Deals object with `CrmAssociation` links and `CrmActivity` diffs, satisfies **AC-4**.
9. Implement message and activity sync into communication threads and messages with external id dedupe, satisfies **AC-5**, **AC-11**.
10. Add 429 backoff with a five attempt cap and 60 second ceiling, revision mismatch handling, error status and retry of failed items, satisfies **AC-9**, **AC-10**, **AC-11**, **AC-17**.
11. Build the settings screen for key entry, list and field choice, status, failed items and sync actions, and add source badges to existing customer and deal screens, satisfies **AC-1**, **AC-12**, **AC-14**, **AC-17**.
12. Add the nightly reconciliation, the 30 day payload cleanup that keeps the dedupe ledger, and the failure counter, satisfies **AC-14**, **AC-15**, **AC-16**.
13. Add unit and integration tests for the scenarios in Feature design, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-6**, **AC-7**, **AC-8**, **AC-9**, **AC-10**, **AC-11**, **AC-12**, **AC-13**, **AC-14**, **AC-15**, **AC-16**, **AC-17**.

## Consequences

**Positive**:

- One credential set per organization supports many connected organizations, and an admin can manage it without a deploy.
- Webhooks give near immediate updates, and the nightly reconciliation catches missed deliveries.
- Synced records live in screens your team already uses, so there is no second customer list to learn.
- Idempotency keys, version checks and event dedupe make retries safe.

**Negative / tradeoffs**:

- Last write wins can discard a close edit from one side. The retained payload and structured log let you find it, but they do not restore it.
- Two way sync needs ongoing care for schema changes, rate limits and out of order events.
- Storing credentials in the database depends on `ENCRYPTION_KEY` being managed well. A rotated or lost key makes stored credentials unreadable.
- Message threads reuse the `participantPhone` column for email and chat identifiers, which is a slight model mismatch and may need a real column later.
- Inbox compose and deletes are out of scope, so staff still switch to Customermates for those actions.
- Inbound events during a backfill wait for the page to finish, which adds a little delay to those records.
- The webhook acknowledges before the work runs, so a failed apply is not visible to Customermates. It is visible in our failed list and counters instead.
- Encrypting credentials means a lost or changed `ENCRYPTION_KEY` forces every admin to enter their key again.

**Neutral**:

- A new package joins the workspace and needs its own build and test entries in Turbo.
- The `IntegrationDefinition` seed row is data shipped through a Prisma migration, following the repo rule that database changes include migrations.
- No new global environment variable is added.

## Follow-up

- [ ] Design a separate spec if the schema editor grows into a full Customermates list and field management surface.
- [ ] Document the existing integration framework, worker setup and telemetry conventions if other features need them as prerequisites; there is no dedicated spec for them today.
- [ ] Confirm the Customermates key owner role with the workspace admin before connect, because keys inherit that user's permissions and have no per key scopes.
- [ ] Decide later whether to add a dedicated participant identifier column when email and chat threads become common.
- [ ] Consider inbound deletes and a conflict review screen in a later spec if last write wins proves too lossy.
- [ ] Write the `ENCRYPTION_KEY` rotation runbook, including reentry of credentials and verification of webhook secrets.
- [ ] Revisit write back if lost edits become a real problem. Inbound sync with a link back to Customermates would remove most of the conflict machinery.

## Rationale

Reasoning, options considered and sources: see `rationale.md`.

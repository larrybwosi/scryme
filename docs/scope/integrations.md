# Scope: Integrations (`apps/api`, `apps/crm`, `packages/customermates`)

Connections to external systems and the two way flow of their records through Scryme.

**Build approach:** Skateboard (project default from `AGENTS.md`).
**Workflow:** Beta.

## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| 1 | Customermates two way integration | Integration | in-progress |

## Integration connections

### 1. Customermates two way integration
Connect one Customermates workspace per organization, receive their contact, organization, deal, activity and message changes through signed webhooks, backfill and reconcile the records, and push Scryme edits back for name, email and phone.
**Done when:** An admin can connect and disconnect, a backfill completes in checkpoints, synced records appear in existing customer and deal screens with a source badge, edits reach Customermates with safe retries, and verification and tests pass for AC-1 through AC-17.
- [x] Design it (spec): [0046](../specs/0046-customermates-two-way-integration/index.md)
- [x] Build it: /develop Customermates two way integration
  - [x] Foundation and thin loop: migration, `@repo/customermates` client, signed webhook route, connection endpoints, contact and organization sync with write back, satisfies **AC-1**, **AC-3**, **AC-6**, **AC-7**, **AC-8**, **AC-12**, **AC-13**
  - [x] Backfill and reconciliation: resumable worker, nightly pass, event mapping, deal and message sync, satisfies **AC-2**, **AC-4**, **AC-5**, **AC-16**
  - [x] Hardening and screens: retry caps, schema refresh, secret rotation, failed items, settings screen, retention and counters, satisfies **AC-9**, **AC-10**, **AC-11**, **AC-14**, **AC-15**, **AC-17**
  - [ ] Unit and integration tests for the critical scenarios, satisfies **AC-1** through **AC-17**
- [ ] Verify it: /check verify Customermates two way integration
- [ ] Test it: /test Customermates two way integration

Spec 0046 · code in `packages/customermates`, `apps/api/src/v3/modules/crm-integrations`, `apps/crm`

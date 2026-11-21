# Verify: CI CD and DevOps Standard · spec 0045 · updated 2026-11-19

_Steps derived from spec 0045 invariants. `/check verify` runs these. `/test` locks the durable ones._

## UI / manual

- [x] Open a pull request that changes `apps/api` and target `main` → required checks `lint`, `unit`, `integration`, `native checks`, `docs metadata` and `verify build` all report a result, and none is skipped → INV-1
- [ ] Open the same pull request from a fork → no repository secret appears in any pull request job and caches are read only → INV-3, INV-13
- [ ] Change a file under `apps/android` only → the affected job adds `android` without any edit to a hand maintained filter map → INV-2
- [ ] Change a file under `docs/` only → code checks report success with a clear reason and `docs metadata` runs → INV-1
- [ ] Open the release workflow after a Changesets version commit on main → `ci success` and `provenance check` are green before publish starts → INV-10
- [ ] Inspect the staging deployment → it starts automatically from the same digest built on main, and health passes → INV-7, INV-11
- [ ] Inspect the production deployment → it waits for a named environment approver, then confirms the active digest matches → INV-11, INV-12
- [ ] Run the rollback dispatch with `rollback_to=previous` and a known previous digest → health passes and the release notes say rolled back → INV-12
- [ ] Review the last database migration added with a release → it is backward compatible so an application rollback remains safe → INV-14
- [x] Open a pull request touching `apps/api` → the `integration` check runs the migration compatibility command and reports a result → INV-14
- [ ] Add a destructive migration in a scratch branch → the integration check fails with the migration file and rule named → INV-14
- [ ] Inspect the release job names → pull request checks keep their original names and release checks carry a release prefix → INV-1
- [ ] Inspect a deploy run → every digest in the report is pulled and tagged as a local `scryme` image, and compose runs with `--no-build` → INV-7
- [ ] Trigger the rollback dispatch without `rollback_digest` → the previous digest and report are resolved, health passes and the release notes say rolled back → INV-12
- [ ] Inspect the Android bundle artifact → its provenance JSON and checksum file are inside the artifact → INV-8

## Commands

- [ ] `node scripts/ci/check-commands.js '["api","pos","bakery","projects"]'` → exits 0, and removing a canonical alias makes it fail with a named workspace and command → INV-4
- [x] `pnpm turbo run test --dry=json` → the task graph resolves with the new root `test` script → INV-4
- [x] `pnpm --filter api test -- --coverage --coverage.reporter=json-summary --coverage.reporter=json` → writes `apps/api/coverage/coverage-summary.json` → INV-5
- [x] `node scripts/ci/check-coverage.js api HEAD~1` → passes when floors are met and fails with a named metric when a floor is missed → INV-5
- [x] `node scripts/ci/check-docs.js HEAD~1` → exits 0 for clean docs and names a broken relative link when one exists → INV-1
- [ ] `jq -e '.tests | type == "array"' .github/flaky-tests.yml` → manifest is valid, and an entry missing `owner`, `issueUrl` or `addedOn` fails the unit job → INV-6
- [x] Inspect `.github/workflows/build.yml` image step → each image has a version tag, a commit tag, a digest output, provenance and SBOM, and promotion uses the digest → INV-7, INV-8
- [x] Inspect `.github/workflows/build.yml` native bundle steps → each bundle has a `<artifact>.provenance.json` file and an attestation → INV-8
- [x] Inspect cache steps in `checks.yml` and `build.yml` → keys contain runner OS, lockfile hash and task name, each has a restore key, and pnpm uses the setup node lockfile cache → INV-9
- [x] Inspect `.github/workflows/test.yml` → no `secrets` or `secrets: inherit` on any pull request job → INV-3, INV-13
- [x] Inspect `.env.ci.mock` and the setup composite action → CI configuration is mock only and no real secret is written into a test job → INV-13
- [x] `node scripts/ci/quarantine-pattern.js` → prints a count and a pattern that omits quarantined test names, and an entry missing a required field fails with the field named → INV-6
- [x] `node scripts/ci/check-migrations.js HEAD~1` → exits 0 for clean migrations and names the file and rule for a destructive statement → INV-14
- [x] `node scripts/ci/check-commands.js '["@scryme/sdk"]'` → passes with the added `type-check` alias → INV-4
- [x] Inspect the unit job checkout → it uses full history so `check-coverage.js` enforces the changed line floor and fails loudly for an invalid base → INV-5
- [x] Inspect cache steps in `checks.yml` and `build.yml` → Gradle keys include the task name and wrapper hash, and Rust keys include task names → INV-9

## Acceptance criteria coverage

INV-1 covered by UI steps 1 and 4 and command step 6 · INV-2 covered by UI step 3 · INV-3 covered by UI step 2 and command step 10 · INV-4 covered by command steps 1 and 2 · INV-5 covered by command steps 3 and 4 · INV-6 covered by command step 7 · INV-7 covered by UI step 6 and command step 8 · INV-8 covered by command steps 8 and 9 · INV-9 covered by command step 9 · INV-10 covered by UI step 5 · INV-11 covered by UI steps 6 and 7 · INV-12 covered by UI steps 7 and 8 · INV-13 covered by UI step 2 and command steps 10 and 11 · INV-14 covered by UI step 9

Implementation follow up covers INV-1 through UI step 12 · INV-4 through command step 14 · INV-5 through command step 15 · INV-6 through command step 12 · INV-7 through UI step 13 · INV-8 through UI step 14 · INV-9 through command step 16 · INV-10 through release workflow inspection · INV-12 through UI step 15 · INV-14 through UI steps 10 and 11 and command step 13

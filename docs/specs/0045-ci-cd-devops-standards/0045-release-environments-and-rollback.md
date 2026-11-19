# 0045.4 Release, Environments and Rollback

**Date**: 2026-11-19

## Summary

This child defines how a tested build becomes a release. Changesets on main starts the release only after CI is green. Staging is automatic, production needs a named approver, and a bad release is undone by redeploying the previous digest behind a health gate.

## Decision

Keep Changesets as the release trigger, but gate it on successful CI for the release commit. Create the version tag from that commit before publishing, publish artifacts built by 0045.3, deploy staging automatically, and require a named approver for production. Rollback redeploys the previous artifact digest and must pass a health check before the incident is closed.

## Standard definition

**Canonical pattern**:

```yaml
ci_success:
  needs: [lint, unit, integration, native checks, verify build, test e2e]
  outputs:
    passed: ${{ steps.result.outputs.passed }}

provenance_check:
  needs: [build]
  outputs:
    passed: ${{ steps.verify.outputs.passed }}

release:
  needs: [ci_success, provenance_check]
  if: needs.ci_success.outputs.passed == 'true' && needs.provenance_check.outputs.passed == 'true'
  steps:
    - run: pnpm version-packages
    - run: git tag "v${{ inputs.version }}" && git push origin "v${{ inputs.version }}"
    - run: pnpm release
    - uses: ./.github/workflows/deploy.yml
      with:
        environment: staging
        digest: ${{ inputs.digest }}
    - uses: ./.github/workflows/deploy.yml
      with:
        environment: production
        digest: ${{ inputs.digest }}
        approver: required
```

`ci_success` depends on the required check jobs by name and sets `passed` when all succeed. `test e2e` is the main only Playwright job defined in `build.yml`. `provenance_check` verifies every digest and attestation produced by 0045.3. The `version` and `digest` inputs come from the build in 0045.3, where version is produced by `scripts/ensure-unique-version.js` before the build.

Promotion record:

- Version comes from Changesets and the unique version script.
- Commit SHA comes from the release commit.
- Digest comes from the build in 0045.3.
- Approver comes from the GitHub environment approval record.
- Health result comes from the deployment check after each deploy.

All five values are written to the release job summary and appended to the GitHub release notes. The release state is `release complete` only after production health passes. A publish job reads repository secrets, never a pull request job. Configuration comes from `.env.example` plus `.env.ci.mock`, and no real secret is written into a test job.

**Replaces**:

- A release that can publish with `continue-on-error: true` steps.
- A tag created after publishing, which leaves a window with artifacts and no source tag.
- `pnpm install --no-frozen-lockfile` in release jobs.
- Direct production movement with no named approver or recorded health result.
- Fix forward as the only recovery path.

**Enforcement**:

`ci_success` and `provenance_check` are required jobs before publish. The production environment has a protection rule with named reviewers drawn from the repository maintainers, and the deployment job fails when approval or health is missing. Emergency releases use the same named reviewers. Branch protection and environment protection are configured together, so a check rename cannot silently drop the gate (basis: [About protected branches](https://docs.github.com/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)). Changesets owns version and publish intent in this repo (basis: [changesets/changesets](https://github.com/changesets/changesets)).

Operational rules:

- Release starts on `push` to `main` when Changesets finds a version commit. A `workflow_dispatch` with a version input retries an existing `v*` tag.
- `deploy.yml` is the digest consumer for managed environments. It runs the target health command, requires a zero exit within the 20 minute health timeout, and confirms that the active digest matches the deployed digest. `deploy.sh` remains for local compose use only.
- The previous digest is the immediate earlier successful deployment recorded by `deploy.yml` in GHCR tag history.
- Rollback is a `workflow_dispatch` with `rollback_to=previous`. It requires the production named approver and closes the incident when health passes and the release notes say `rolled back`.
- A failed publish writes `publish failed` to the release notes and leaves a failed check, even if the tag already exists.
- Database migrations must stay backward compatible for one release so an application rollback is safe.

**Rollout**:

The migration pull request adds the `ci_success` and `provenance_check` jobs ahead of the existing publish steps, then moves tag creation before publish. Staging and production environment rules are configured before the first gated release. The existing Changesets flow and version script stay in place.

**Exceptions**:

None. Emergency releases use the same path with the same named production approver.

## Consequences

**Positive**:

- A release cannot start from a commit that failed CI.
- The tag, commit, digest, approver, and health result form one audit trail.
- Rollback is a redeploy of bytes that already passed the same gates.

**Negative / tradeoffs**:

- Production releases wait for a human approver.
- Tag creation before publish can leave a tag if publishing fails, so the release job writes `publish failed` to the release notes and fails the check.
- Health checks must be reliable, or they will block otherwise good deployments.
- Native bundles have no database coupling, while image rollback depends on the backward compatible migration rule.

## Rationale

The team picked traceability and a named production approver as release rules. Changesets already declares which versions ship, but the current workflow publishes after a release commit without requiring CI success and can continue past failed publish steps. Gating on CI and provenance closes that gap without replacing the release tool. Repository secrets remain in publish jobs by explicit decision, with fork pull requests excluded at the pipeline layer. OIDC is the stronger long term option and is documented for short lived deployment credentials (basis: [OpenID Connect](https://docs.github.com/en/actions/security-for-github-actions/security-hardening-your-deployments/about-security-hardening-with-openid-connect)), but provider setup is outside this standard and is recorded for a later decision.

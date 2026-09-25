---
name: hitl-approvals
description: Manage human-in-the-loop approvals for sensitive administrative tasks before execution.
version: 1.0.0
author: Scryme Core Team
license: MIT
platforms: [linux, macos]
metadata:
  hermes:
    tags: [security, approval, hitl, governance]
    category: security
---

# Human In The Loop Approvals Skill

## When to Use
Trigger whenever an administrative action is classified as sensitive (e.g. updating organization permissions, changing system settings, running bulk deletions).

## Procedure
1. Identify the sensitive action and target resources.
2. Invoke `request_human_approval` with `org_slug`, `channel`, `action`, and `details`.
3. Wait for the human administrator to approve or decline via ScrymeChat interactive buttons.
4. If approved, execute the task. If rejected or timed out, report cancellation.

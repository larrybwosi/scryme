---
name: admin-reporting
description: Generate automated administrative reports (sales, stock alerts, audit logs) for Scryme organizations.
version: 1.0.0
author: Scryme Core Team
license: MIT
platforms: [linux, macos]
metadata:
  hermes:
    tags: [reporting, analytics, audit, inventory]
    category: administration
---

# Admin Reporting Skill

## When to Use
Trigger when asked for sales summaries, inventory stock reports, system activity logs, or scheduled organizational health reports.

## Procedure
1. Use `get_sales_summary` with `org_slug` to fetch revenue and transaction stats.
2. Use `get_stock_alerts` to find inventory items below threshold.
3. Use `get_audit_summary` to review administrative changes and audit events.
4. Format the aggregated data into a structured report using markdown or custom ScrymeChat report cards.
5. Send the report using `send_scryme_chat_message`.

## Verification
Confirm the returned API data is formatted clearly and sent to the requested channel.

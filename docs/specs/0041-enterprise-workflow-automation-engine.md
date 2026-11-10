# 0041 · Enterprise Workflow Automation Engine & Studio

**Status**: Accepted
**Date**: 2026-11-10
**Authors**: Core Platform Engineering

## Context & Motivation
Scryme provides modern ERP and CRM automation capabilities for multi-tenant businesses. Previously, the workflow studio provided a visual canvas (`@xyflow/react`) alongside predefined background handlers (`expiry_cleanup`, `lowstock_alert`, `daily_sales_report`, `preorder_notification`, `stock_movement_report`, `outgoing_webhook`). However, custom canvas graphs configured by users were saved to the configuration without an end-to-end DAG execution engine that could interpret arbitrary nodes (triggers, branch conditions, filters, delay, webhooks, emails, ScrymeChat, and data mutations) step-by-step.

Enterprise standards demand:
1. **End-to-End DAG Interpretation**: The backend automation engine interprets canvas definitions (`nodes` and `edges`) and executes each step sequentially with full audit logging in `WorkflowEngineAuditLog`.
2. **Dual-Mode Execution (Live vs. Dry-Run Simulation)**: Engineers and business administrators can run dry-run simulations with sample JSON payloads to test condition branches and data transformations without firing external side-effects (e.g. sending real emails or external webhook dispatches).
3. **Resilient Replay & Dead-Letter Handling**: Ability to replay past executions directly from the studio UI with idempotency and audit tracking.
4. **Interactive Studio Enhancements**: Fast test runner with dual Live & Simulate buttons, sample payload drawer, step-by-step visual execution logs, and live status inspection.

## Architecture & System Design

### 1. Workflow DAG Interpreter (`WorkflowDagRunnerService`)
When a workflow is triggered with custom canvas nodes and edges:
- **Node Classification**:
  - `trigger`: Starting node (`event`, `schedule`, `webhook`, `manual`).
  - `logic`:
    - `branch`: Conditional branching evaluating `rules` (operators: `equals`, `not_equals`, `contains`, `greater_than`, `less_than`, `is_empty`, `is_not_empty`) with match mode `ALL` or `ANY`.
    - `filter`: Hard gate stopping execution if conditions are not met.
  - `action`:
    - `send_email`: Email dispatch via platform mail service with template variable interpolation (`{{payload.field}}`).
    - `scryme_chat`: Message dispatch to organizational chat channels.
    - `http_request`: Direct outbound HTTP request with method, headers, and body.
  - `delay`: Simulated or scheduled pause window.
  - `data`: Database mutations / records update.
  - `webhook`: Outgoing registered webhook dispatch with HMAC signing.
- **Sequential Step Execution**: The DAG runner traces paths starting from the active trigger node through outgoing edges. Each evaluated step logs a granular entry into `WorkflowEngineAuditLog` with action name, step ID, status, inputs, and outputs.
- **Dry-Run Simulation**: Flags `isSimulation: true` prevent actual side-effects (external HTTP calls, database updates, emails, chat messages), recording simulated step results and branch selections.

### 2. NestJS Backend Endpoints
Under `:orgSlug/automation`:
- `POST /simulate`: Executes dry-run simulation of a workflow definition or draft canvas with custom inputs.
- `POST /replay`: Replays an existing `WorkflowEngineExecution` using its historical payload and definition.
- `GET /executions/:id/steps`: Returns the structured step trace logs for an execution.

### 3. Next.js Studio UI (`apps/web/app/workflows`)
- **Simulate Modal**: Dedicated dialog for inputting test JSON and previewing step outcomes and condition matches.
- **Replay Control**: Replay button directly on execution cards and logs view.
- **Enhanced Canvas Sync**: Clean node and edge serialization preserving step configuration, condition rules, and execution options.

## Value Sourcing & Verification Table

| Value / Field | Source | Verification |
|---|---|---|
| Trigger Payload | Incoming request body or event payload | Verified in `triggerWorkflow` and `simulateWorkflow` |
| Node Step Evaluation | Evaluated in memory against `payload` & `context` | `WorkflowDagRunnerService.evaluateConditions` unit test |
| Step Audit Logs | Appended to `WorkflowEngineAuditLog` | Checked in step tracing and logs view |
| Replay Execution | Cloned from prior `execution.payload` & `definitionId` | Verified in `replayWorkflow` endpoint |

# 0043 · Preorder Workflow Automation and Customer WhatsApp Notifications

**Status**: Accepted
**Date**: 2026-11-11
**Authors**: Core Platform Engineering

## Context and Motivation
Scryme provides retail POS and custom preorder management alongside bakery and batch production modules. When customers make preorders or custom sales, operations teams must coordinate between customer intake, kitchen scheduling, and customer communication.

Previously, preorder notifications were handled via static alert handlers with hardcoded message templates, and automated batch creation did not take advantage of configurable workflow settings such as scheduling lead times, default operator assignments, or dynamic customer WhatsApp templates.

This specification unifies the preorder automation workflow so that:
1. When a preorder is created in POS or online, the workflow engine triggers multi channel notifications across Scryme Chat, Firebase push notifications, staff emails, and realtime dashboard streams.
2. The workflow can schedule an on demand production batch automatically with customizable lead times, linked project tasks, and assigned bakers.
3. Upon batch completion in production, the system sends an automated WhatsApp message to the customer using customizable message templates and variable interpolation.
4. The Workflow Studio provides full visual canvas and schema customization for the preorder automation template.

## Architecture and System Design

### 1. Workflow Engine Integration
The preorder automation workflow is registered as a template under key `preorder_notification` (alias `f/dealio/preorder_notification`) in `AutomationService`.

Configurable parameters in the schema include:
- `notificationEmail`: Email address or comma separated list of recipients for preorder intake alerts.
- `enableScrymeChat`: Toggle to dispatch alerts to Scryme Chat channels.
- `enablePushNotifications`: Toggle to broadcast FCM push notifications to staff devices.
- `enableEmailNotifications`: Toggle to send preorder intake email summaries.
- `enableRealtimeAlerts`: Toggle to broadcast realtime WebSocket alerts to active browser sessions.
- `autoScheduleBatch`: Toggle to automatically create on demand production batches for ordered items with active recipes.
- `batchLeadTimeHours`: Configurable buffer time in hours before the order due date to schedule production start.
- `autoCreateTask`: Toggle to auto generate a linked project task in the projects workspace.
- `defaultLeadBakerId`: Default baker or operator assigned to the scheduled batch.
- `enableCustomerWhatsapp`: Toggle to send WhatsApp notifications to customers upon batch completion.
- `customerWhatsappTemplate`: Customizable WhatsApp message template supporting placeholders such as `{{customerName}}`, `{{orderNumber}}`, `{{productName}}`, `{{remainingBalance}}`, `{{currency}}`, and `{{dueDate}}`.

### 2. POS Preorder Intake and Batch Scheduling
In `ProcessSaleUseCase`, when a sale is created with status `PREORDER` or flagged as a custom order:
- The system checks active workflow configuration for `preorder_notification`.
- For each physical line item matching a production recipe, an on demand batch is scheduled respecting the configured lead time buffer, linked task settings, and assigned operator.
- The workflow execution is queued with the enriched transaction details.

### 3. Multi Channel Staff Notifications
In `WorkflowHandlers.handlePreorderNotification`:
- Evaluates configured channel toggles.
- Scryme Chat receives an interactive card with quick actions to view the transaction, update status, or contact the customer.
- Firebase Messaging sends notifications to organization staff.
- Mail service sends transactional notifications.
- Realtime gateway broadcasts preorder events to front of house screens.

### 4. Production Completion Customer WhatsApp Notification
In `ProductionService.completeBatch`:
- When a batch linked to an order is completed, the system checks whether customer WhatsApp notifications are enabled in the organization workflow configuration.
- The system formats the message text using the customized template, replacing placeholders with order number, customer name, recipe name, and balance.
- Dispatches the message via `WhatsappService`.

### 5. Workflows Studio Visual Canvas
In `apps/web/app/workflows/client.tsx`, `initialGraph` provides a visual DAG representation of the preorder automation flow:
- Trigger node: Preorder Created event.
- Logic node: Check if item has recipe and valid customer contact.
- Action node: Schedule Production Batch.
- Action node: Notify Staff (Scryme Chat, FCM, Email).
- Action node: Send WhatsApp to Customer on Completion.

## Value Sourcing and Verification Table

| Value / Field | Source | Verification |
|---|---|---|
| Preorder Payload | Transaction record and POS checkout input | Unit test in `process-sale.use-case.spec.ts` |
| Batch Schedule Time | Due date minus workflow lead time buffer | Unit test in `process-sale.use-case.spec.ts` |
| Staff Notification Toggles | Workflow configuration in `WorkflowEngineDefinition` | Unit test in `workflow-handlers.spec.ts` |
| Customer WhatsApp Message | Dynamic template interpolation in `ProductionService` | Unit test in `on-demand-production.spec.ts` |
| Studio Canvas Definition | `initialGraph` in `apps/web/app/workflows/client.tsx` | Verification in Studio UI component tests |

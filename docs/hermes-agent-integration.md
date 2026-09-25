# Hermes Agent Integration Guide

This guide details how Hermes Agent is integrated into the Scryme platform for administrative task automation, reporting, ScrymeChat actions, and Human-In-The-Loop (HITL) approval workflows.

---

## 1. Architecture Overview

Hermes Agent runs as an autonomous agent and messaging gateway service communicating with Scryme System through:
- NestJS V3 API (`/v3/:orgSlug/agent/*`): Endpoints for sending channel messages, posting interactive approval cards, and receiving callback decisions.
- ScrymeChat Integration (`@repo/chat`): Dispatching real-time messages and interactive action buttons (`approve_*`, `decline_*`) directly into chat channels.
- Custom Hermes Plugin (`integrations/hermes-agent`): Exposes built-in tools and skills (`admin-reporting`, `scryme-messaging`, `hitl-approvals`).

---

## 2. Component Layout

- `integrations/hermes-agent/plugin.yaml`: Hermes Agent plugin definition
- `integrations/hermes-agent/__init__.py`: Tool registrations (`get_sales_summary`, `get_stock_alerts`, `send_scryme_chat_message`, `request_human_approval`)
- `integrations/hermes-agent/config.example.yaml`: Configuration template for Hermes daemon/gateway
- `integrations/hermes-agent/tools/api_client.py`: HTTP V3 API client with API Key auth
- `integrations/hermes-agent/skills/`: Skills (`admin-reporting`, `scryme-messaging`, `hitl-approvals`)

- `apps/api/src/v3/modules/agent/agent.module.ts`: NestJS V3 Agent Module
- `apps/api/src/v3/modules/agent/agent.service.ts`: Messaging and HITL approval handling
- `apps/api/src/v3/modules/agent/dto/agent.dto.ts`: Validation DTOs
- `apps/api/src/v3/modules/agent/interfaces/agent.controller.ts`: REST Controller (`/v3/:orgSlug/agent/messages`, `/v3/:orgSlug/agent/approvals`)

---

## 3. Security & Scope Constraints

Hermes Agent authentication and authorization operate strictly under Scryme V3 permissions:
- Requests require a valid V3 API Key header (`x-api-key`).
- Target tenant is scoped via `x-org-slug` or path parameters.
- Permission guards enforce scope restrictions (`agent:write`, `messages:write`, `approvals:write`).
- Sensitive operations require explicit human approval via interactive buttons before execution.

---

## 4. Setup & Deployment Steps

1. Install Hermes Agent:
   `curl -fsSL https://raw.githubusercontent.com/nousresearch/hermes-agent/main/install.sh`

2. Configure Hermes Gateway:
   Copy `integrations/hermes-agent/config.example.yaml` to `~/.hermes/config.yaml`.

3. Configure Environment Variables:
   Add the following to `~/.hermes/.env`:
   - `SCRYME_API_URL=http://localhost:3000`
   - `SCRYME_V3_API_KEY=your_v3_api_key_here`
   - `HERMES_WEBHOOK_SECRET=scryme-hermes-secret`

4. Launch Hermes Gateway:
   `hermes gateway`

# Hermes Agent Integration for Scryme System

This directory contains the Hermes Agent plugin, tools, skills, and configuration templates for administrative automation within the Scryme ecosystem.

## Components

- **plugin.yaml & __init__.py**: Custom Hermes Agent plugin registering tools for sales analytics, stock alerts, audit logging, ScrymeChat messaging, and human-in-the-loop (HITL) approval requests.
- **skills/**: Reusable skills (admin-reporting, scryme-messaging, hitl-approvals).
- **config.example.yaml**: Standard configuration file for Hermes Agent daemon/gateway.

## Setup & Running

1. Install Hermes Agent on your server:
   `curl -fsSL https://raw.githubusercontent.com/nousresearch/hermes-agent/main/install.sh | sh`

2. Copy configuration and environment:
   `cp integrations/hermes-agent/config.example.yaml ~/.hermes/config.yaml`

3. Set required environment variables in `~/.hermes/.env`:
   - `SCRYME_API_URL=http://localhost:3000`
   - `SCRYME_V3_API_KEY=your_v3_api_key_here`
   - `HERMES_WEBHOOK_SECRET=scryme-hermes-secret`

4. Run Hermes Gateway:
   `hermes gateway`

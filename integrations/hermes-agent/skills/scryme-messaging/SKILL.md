---
name: scryme-messaging
description: Handle ScrymeChat messaging actions, routing incoming commands and posting response cards.
version: 1.0.0
author: Scryme Core Team
license: MIT
platforms: [linux, macos]
metadata:
  hermes:
    tags: [chat, messaging, scrymechat]
    category: communication
---

# Scryme Messaging Skill

## When to Use
Trigger when receiving messages or commands from ScrymeChat channels or webhooks.

## Procedure
1. Parse the incoming command payload from `{__raw__}` or parameters.
2. Call appropriate administrative tools based on the user's intent.
3. Formulate a polite, helpful response with actionable data.
4. Send the output to the target channel via `send_scryme_chat_message`.

"""
Scryme Hermes Agent Plugin
Exposes administrative tools, reporting functions, ScrymeChat messaging, and HITL approval transports.
"""

import json
import logging
from .tools.api_client import make_v3_request

logger = logging.getLogger("scryme_hermes_agent")

def get_sales_summary(org_slug: str, date_from: str = None, date_to: str = None) -> str:
    params = []
    if date_from:
        params.append(f"startDate={date_from}")
    if date_to:
        params.append(f"endDate={date_to}")
    query_str = f"?{'&'.join(params)}" if params else ""
    endpoint = f"/v3/{org_slug}/analytics/sales/summary{query_str}"
    result = make_v3_request(endpoint, method="GET", org_slug=org_slug)
    return json.dumps(result)

def get_stock_alerts(org_slug: str, threshold: int = 10) -> str:
    endpoint = f"/v3/{org_slug}/inventory/low-stock?threshold={threshold}"
    result = make_v3_request(endpoint, method="GET", org_slug=org_slug)
    return json.dumps(result)

def get_audit_summary(org_slug: str, limit: int = 20) -> str:
    endpoint = f"/v3/{org_slug}/admin/audit-logs?limit={limit}"
    result = make_v3_request(endpoint, method="GET", org_slug=org_slug)
    return json.dumps(result)

def send_scryme_chat_message(org_slug: str, channel: str, content: str, custom_message_type: str = None) -> str:
    endpoint = f"/v3/{org_slug}/agent/messages"
    payload = {
        "channel": channel,
        "content": content,
        "type": custom_message_type or "text"
    }
    result = make_v3_request(endpoint, method="POST", data=payload, org_slug=org_slug)
    return json.dumps(result)

def request_human_approval(org_slug: str, channel: str, action: str, details: str, requested_by: str = "Hermes Agent") -> str:
    endpoint = f"/v3/{org_slug}/agent/approvals"
    payload = {
        "channel": channel,
        "action": action,
        "details": details,
        "requestedBy": requested_by
    }
    result = make_v3_request(endpoint, method="POST", data=payload, org_slug=org_slug)
    return json.dumps(result)

def register(ctx):
    """Register Scryme tools and hooks with Hermes Agent context."""
    ctx.register_tool(
        name="get_sales_summary",
        toolset="scryme_admin",
        schema={
            "name": "get_sales_summary",
            "description": "Fetch sales metrics, revenue summary, and transaction stats for an organization.",
            "parameters": {
                "type": "object",
                "properties": {
                    "org_slug": {"type": "string", "description": "Organization slug"},
                    "date_from": {"type": "string", "description": "Start date ISO format (YYYY-MM-DD)"},
                    "date_to": {"type": "string", "description": "End date ISO format (YYYY-MM-DD)"}
                },
                "required": ["org_slug"]
            }
        },
        handler=get_sales_summary
    )

    ctx.register_tool(
        name="get_stock_alerts",
        toolset="scryme_admin",
        schema={
            "name": "get_stock_alerts",
            "description": "Fetch low-stock inventory items and reorder warnings.",
            "parameters": {
                "type": "object",
                "properties": {
                    "org_slug": {"type": "string", "description": "Organization slug"},
                    "threshold": {"type": "integer", "description": "Stock threshold count (default 10)"}
                },
                "required": ["org_slug"]
            }
        },
        handler=get_stock_alerts
    )

    ctx.register_tool(
        name="get_audit_summary",
        toolset="scryme_admin",
        schema={
            "name": "get_audit_summary",
            "description": "Fetch administrative system activity logs and audit records.",
            "parameters": {
                "type": "object",
                "properties": {
                    "org_slug": {"type": "string", "description": "Organization slug"},
                    "limit": {"type": "integer", "description": "Number of logs to fetch (default 20)"}
                },
                "required": ["org_slug"]
            }
        },
        handler=get_audit_summary
    )

    ctx.register_tool(
        name="send_scryme_chat_message",
        toolset="scryme_chat",
        schema={
            "name": "send_scryme_chat_message",
            "description": "Send a message or formatted report card to a ScrymeChat channel.",
            "parameters": {
                "type": "object",
                "properties": {
                    "org_slug": {"type": "string", "description": "Organization slug"},
                    "channel": {"type": "string", "description": "Target channel slug or ID"},
                    "content": {"type": "string", "description": "Message text/markdown content"},
                    "custom_message_type": {"type": "string", "description": "Optional type (e.g. 'report', 'card', 'text')"}
                },
                "required": ["org_slug", "channel", "content"]
            }
        },
        handler=send_scryme_chat_message
    )

    ctx.register_tool(
        name="request_human_approval",
        toolset="scryme_hitl",
        schema={
            "name": "request_human_approval",
            "description": "Dispatch a Human-In-The-Loop approval request to ScrymeChat with interactive buttons for sensitive actions.",
            "parameters": {
                "type": "object",
                "properties": {
                    "org_slug": {"type": "string", "description": "Organization slug"},
                    "channel": {"type": "string", "description": "Target approval channel slug or ID"},
                    "action": {"type": "string", "description": "Action name (e.g., 'PERM_GRANT', 'SETTINGS_UPDATE')"},
                    "details": {"type": "string", "description": "Explanation of the action requiring approval"},
                    "requested_by": {"type": "string", "description": "Requestor name or agent ID"}
                },
                "required": ["org_slug", "channel", "action", "details"]
            }
        },
        handler=request_human_approval
    )

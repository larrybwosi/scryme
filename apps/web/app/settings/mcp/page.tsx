import { Metadata } from "next";
import { Bot } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getMcpApiKeysAction } from "@/app/actions/mcp";
import { McpSettingsClient } from "./mcp-settings-client";

export const metadata: Metadata = {
  title: "MCP Integrations - Scryme Settings",
  description: "Connect AI assistants to your Scryme workspace using Model Context Protocol (MCP).",
};

export default async function McpSettingsPage() {
  const initialKeys = await getMcpApiKeysAction();

  return (
    <div className="w-full space-y-6 p-6">
      <PageHeader
        title="MCP Integrations"
        subtitle="Connect AI assistants (Claude, Cursor, Agents) directly to your live Scryme workspace data"
        icon={<Bot className="w-7 h-7 text-indigo-500" />}
      />

      <McpSettingsClient initialKeys={initialKeys} />
    </div>
  );
}

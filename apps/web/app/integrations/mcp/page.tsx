import { Metadata } from "next";
import { Bot } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { getMcpApiKeysAction } from "@/app/actions/mcp";
import { McpSettingsClient } from "@/app/settings/mcp/mcp-settings-client";

export const metadata: Metadata = {
  title: "Model Context Protocol (MCP) - Integrations",
  description: "Connect AI assistants to your Scryme workspace using Model Context Protocol (MCP).",
};

export default async function McpIntegrationsPage() {
  const initialKeys = await getMcpApiKeysAction();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-350 mx-auto min-h-screen bg-background space-y-6">
      <Breadcrumbs
        items={[
          { label: "Integrations", href: "/integrations" },
          { label: "Model Context Protocol (MCP)" },
        ]}
      />

      <PageHeader
        title="Model Context Protocol (MCP)"
        subtitle="Connect AI assistants (Claude, Cursor, Agents) directly to your live Scryme workspace data"
        icon={<Bot className="w-8 h-8 text-indigo-500" />}
      />

      <McpSettingsClient initialKeys={initialKeys} />
    </div>
  );
}

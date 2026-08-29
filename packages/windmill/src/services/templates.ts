import { getWindmillClientForOrg, WindmillApiClient, encrypt, decrypt } from "./client";
import { ScrymeChatApiClient } from "./scryme-chat";
import * as fs from "fs/promises";
import { Dirent } from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { db as prisma } from "@repo/db";
import { WindmillTemplate } from "../types";

/**
 * Service to manage and deploy Windmill templates to organization workspaces.
 */
export class WindmillTemplateService {
  /**
   * Deploys all templates in the 'templates' directory to an organization's Windmill workspace.
   */
  static async deployTemplatesToOrg(organizationId: string) {
    const templatesDir = path.join(__dirname, "../templates");

    await this.walkTemplates(
      templatesDir,
      "",
      async (scriptPath, content) => {
        const normalizedPath = `f/dealio/${scriptPath.replace(/^(flows|schedules|resources|variables)\//, "")}`;

        try {
          await (prisma as any).workflowEngineDefinition.upsert({
            where: {
              organizationId_key: {
                organizationId,
                key: normalizedPath,
              },
            },
            create: {
              organizationId,
              key: normalizedPath,
              name: scriptPath,
              triggerType: "EVENT",
              config: {},
              isActive: true,
            },
            update: {
              isActive: true,
            },
          });
        } catch (e) {
          console.error(`Failed to deploy ${scriptPath}:`, e);
        }
      },
    );
  }

  /**
   * Provisions a new workspace for an organization and deploys templates.
   */
  static async provisionAndDeploy(
    organizationId: string,
    orgName: string,
    orgSlug: string,
  ) {
    let webhook = await (prisma as any).workflowEngineWebhook.findFirst({
      where: { organizationId, direction: "INCOMING" },
    });

    if (!webhook) {
      const generatedSecret = crypto.randomBytes(32).toString("hex");

      webhook = await (prisma as any).workflowEngineWebhook.create({
        data: {
          organizationId,
          name: `${orgName} Incoming Webhook`,
          direction: "INCOMING",
          endpointUrl: `/v3/automation/webhooks/incoming/${organizationId}/default`,
          secret: generatedSecret,
          isActive: true,
        },
      });
    }

    await this.deployTemplatesToOrg(organizationId);
  }

  /**
   * Deploys a specific template by its path to an organization's Windmill workspace.
   */
  static async deployTemplate(organizationId: string, templatePath: string) {
    const normalizedPath = `f/dealio/${templatePath}`;
    await (prisma as any).workflowEngineDefinition.upsert({
      where: {
        organizationId_key: {
          organizationId,
          key: normalizedPath,
        },
      },
      create: {
        organizationId,
        key: normalizedPath,
        name: templatePath,
        triggerType: "EVENT",
        config: {},
        isActive: true,
      },
      update: {
        isActive: true,
      },
    });
  }

  /**
   * Scans the templates directory and returns a list of available templates with metadata.
   */
  static async getTemplates(): Promise<WindmillTemplate[]> {
    let templatesDir = path.join(__dirname, "../templates");

    try {
      await fs.access(templatesDir);
    } catch (e) {
      templatesDir = path.join(process.cwd(), "../../packages/windmill/templates");
      try {
        await fs.access(templatesDir);
      } catch (e2) {
        templatesDir = path.join(process.cwd(), "packages/windmill/templates");
      }
    }

    const templates: WindmillTemplate[] = [];

    await this.walkTemplates(
      templatesDir,
      "",
      async (scriptPath, content, entry, currentPath) => {
        const name =
          this.extractMetadata(content, "name") ||
          entry.name.replace(/\.(ts|js|json|yaml|yml)$/, "");
        const description = this.extractMetadata(content, "description");
        const category = currentPath.split("/")[0] || "Uncategorized";
        const parameters = this.parseParameters(content);

        templates.push({
          path: scriptPath,
          name,
          description,
          category,
          parameters,
        });
      },
    );

    return templates;
  }

  private static async walkTemplates(
    dir: string,
    currentPath: string,
    callback: (
      scriptPath: string,
      content: string,
      entry: Dirent,
      currentPath: string,
    ) => Promise<void>,
  ) {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const windmillPath = currentPath
        ? `${currentPath}/${entry.name}`
        : entry.name;

      if (entry.isDirectory()) {
        await this.walkTemplates(fullPath, windmillPath, callback);
      } else if (entry.isFile()) {
        const isScript =
          entry.name.endsWith(".ts") || entry.name.endsWith(".js");
        const isJson = entry.name.endsWith(".json");
        const isYaml =
          entry.name.endsWith(".yaml") || entry.name.endsWith(".yml");

        if (isScript || isJson || isYaml) {
          const content = await fs.readFile(fullPath, "utf-8");
          const scriptPath = windmillPath.replace(
            /\.(ts|js|json|yaml|yml)$/,
            "",
          );
          await callback(scriptPath, content, entry, currentPath);
        }
      }
    }
  }

  private static extractMetadata(
    content: string,
    key: string,
  ): string | undefined {
    const regex = new RegExp(`\\*\\s*@${key}\\s+(.+)`);
    const match = content.match(regex);
    return match ? match[1].trim() : undefined;
  }

  private static parseParameters(content: string): any[] {
    const interfaceMatch = content.match(/data:\s*{([\s\S]*?)}/);
    if (!interfaceMatch) return [];

    const fields = interfaceMatch[1]
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    return fields
      .map((field) => this.parseField(field))
      .filter((p): p is any => p !== null);
  }

  private static parseField(field: string): any | null {
    const [nameAndOptional, typeAndComment] = field
      .split(":")
      .map((s) => s.trim());
    if (!nameAndOptional) return null;

    const isOptional = nameAndOptional.endsWith("?");
    const name = nameAndOptional.replace("?", "");
    if (name === "organizationId") return null;

    const type = this.inferType(typeAndComment);

    return {
      name,
      label:
        name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, " $1"),
      type,
      required: !isOptional,
    };
  }

  private static inferType(typeAndComment?: string): string {
    if (!typeAndComment) return "string";
    if (typeAndComment.includes("number")) return "number";
    if (typeAndComment.includes("boolean")) return "boolean";
    if (typeAndComment.includes("'") || typeAndComment.includes('"'))
      return "select";
    return "string";
  }
}

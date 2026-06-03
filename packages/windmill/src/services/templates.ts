import { getWindmillClientForOrg, WindmillApiClient } from './client';
import { ScrymeChatApiClient } from './scryme-chat';
import * as fs from 'fs/promises';
import { Dirent } from 'fs';
import * as path from 'path';
import { db as prisma } from '@repo/db';
import { WindmillTemplate } from '../types';

/**
 * Service to manage and deploy Windmill templates to organization workspaces.
 */
export class WindmillTemplateService {
  /**
   * Deploys all templates in the 'templates' directory to an organization's Windmill workspace.
   */
  static async deployTemplatesToOrg(organizationId: string) {
    const client = await getWindmillClientForOrg(organizationId);
    const templatesDir = path.join(__dirname, '../templates');

    await this.walkTemplates(templatesDir, '', async (scriptPath, content, entry) => {
      const normalizedPath = `f/dealio/${scriptPath.replace(/^(flows|schedules|resources|variables)\//, '')}`;

      try {
        if (scriptPath.startsWith('flows/')) {
          console.log(`Deploying Flow to Windmill: ${scriptPath}`);
          await client.upsertFlow(normalizedPath, JSON.parse(content));
        } else if (scriptPath.startsWith('schedules/')) {
          console.log(`Deploying Schedule to Windmill: ${scriptPath}`);
          await client.upsertSchedule(normalizedPath, JSON.parse(content));
        } else if (scriptPath.startsWith('resources/')) {
          console.log(`Deploying Resource to Windmill: ${scriptPath}`);
          await client.upsertResource(normalizedPath, JSON.parse(content));
        } else if (scriptPath.startsWith('variables/')) {
          console.log(`Deploying Variable to Windmill: ${scriptPath}`);
          const { value, isSecret } = JSON.parse(content);
          await client.setVariable(normalizedPath, value, isSecret);
        } else {
          console.log(`Deploying Script to Windmill: ${scriptPath}`);
          await client.upsertScript(`f/dealio/${scriptPath}`, content);
        }
      } catch (e) {
        console.error(`Failed to deploy ${scriptPath}:`, e);
      }
    });
  }

  /**
   * Provisions a new workspace for an organization and deploys templates.
   */
  static async provisionAndDeploy(organizationId: string, orgName: string, orgSlug: string) {
    let config = await prisma.windmillConfiguration.findUnique({
      where: { organizationId },
    });

    if (!config) {
      throw new Error(`Windmill not configured for organization ${organizationId}`);
    }

    if (!config.workspaceId) {
      const workspaceSlug = `org-${orgSlug}`.toLowerCase();
      const adminApiKey = process.env.WINDMILL_ADMIN_API_KEY || config.windmillApiKey;

      await WindmillApiClient.createWorkspace(
        config.windmillBaseUrl,
        adminApiKey,
        orgName,
        workspaceSlug
      );

      // Also provision Scryme Chat if credentials exist
      let scrymeChatWorkspaceId = config.scrymeChatWorkspaceId;
      let scrymeChatWorkspaceSlug = config.scrymeChatWorkspaceSlug;

      if (!scrymeChatWorkspaceId && process.env.SCRYME_CHAT_CLIENT_ID && process.env.SCRYME_CHAT_CLIENT_SECRET) {
        try {
            const scrymeClient = new ScrymeChatApiClient();
            const scrymeWorkspace = await scrymeClient.createWorkspace(orgName, workspaceSlug);
            scrymeChatWorkspaceId = scrymeWorkspace.id;
            scrymeChatWorkspaceSlug = scrymeWorkspace.slug;
        } catch (e) {
            console.error('Failed to provision Scryme Chat workspace:', e);
        }
      }

      config = await prisma.windmillConfiguration.update({
        where: { organizationId },
        data: {
          workspaceId: workspaceSlug,
          workspaceName: orgName,
          scrymeChatWorkspaceId,
          scrymeChatWorkspaceSlug,
        },
      });
    }

    // Ensure we deploy to the now-provisioned workspace
    await this.deployTemplatesToOrg(organizationId);
  }

  /**
   * Deploys a specific template by its path to an organization's Windmill workspace.
   */
  static async deployTemplate(organizationId: string, templatePath: string) {
    const client = await getWindmillClientForOrg(organizationId);
    const templatesDir = path.join(__dirname, '../templates');
    const fullPath = path.join(templatesDir, `${templatePath}.ts`);

    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      console.log(`Deploying specific template to Windmill: ${templatePath}`);
      await client.upsertScript(`f/dealio/${templatePath}`, content);
    } catch (err: any) {
      // Try with .js if .ts fails
      if (err.code === 'ENOENT') {
        const jsPath = path.join(templatesDir, `${templatePath}.js`);
        const content = await fs.readFile(jsPath, 'utf-8');
        console.log(`Deploying specific template to Windmill: ${templatePath}`);
        await client.upsertScript(`f/dealio/${templatePath}`, content);
      } else {
        throw err;
      }
    }
  }

  /**
   * Scans the templates directory and returns a list of available templates with metadata.
   */
  static async getTemplates(): Promise<WindmillTemplate[]> {
    const templatesDir = path.join(__dirname, '../templates');
    const templates: WindmillTemplate[] = [];

    await this.walkTemplates(templatesDir, '', async (scriptPath, content, entry, currentPath) => {
      const name = this.extractMetadata(content, 'name') || entry.name.replace(/\.(ts|js|json|yaml|yml)$/, '');
      const description = this.extractMetadata(content, 'description');
      const category = currentPath.split('/')[0] || 'Uncategorized';
      const parameters = this.parseParameters(content);

      templates.push({
        path: scriptPath,
        name,
        description,
        category,
        parameters
      });
    });

    return templates;
  }

  private static async walkTemplates(
    dir: string,
    currentPath: string,
    callback: (scriptPath: string, content: string, entry: Dirent, currentPath: string) => Promise<void>
  ) {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      // Use forward slashes for Windmill paths regardless of OS
      const windmillPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        await this.walkTemplates(fullPath, windmillPath, callback);
      } else if (entry.isFile()) {
        const isScript = entry.name.endsWith('.ts') || entry.name.endsWith('.js');
        const isJson = entry.name.endsWith('.json');
        const isYaml = entry.name.endsWith('.yaml') || entry.name.endsWith('.yml');

        if (isScript || isJson || isYaml) {
          const content = await fs.readFile(fullPath, 'utf-8');
          const scriptPath = windmillPath.replace(/\.(ts|js|json|yaml|yml)$/, '');
          await callback(scriptPath, content, entry, currentPath);
        }
      }
    }
  }

  private static extractMetadata(content: string, key: string): string | undefined {
    const regex = new RegExp(`\\*\\s*@${key}\\s+(.+)`);
    const match = content.match(regex);
    return match ? match[1].trim() : undefined;
  }

  private static parseParameters(content: string): any[] {
    const interfaceMatch = content.match(/data:\s*{([\s\S]*?)}/);
    if (!interfaceMatch) return [];

    const fields = interfaceMatch[1].split(/[,\n]/).map(s => s.trim()).filter(Boolean);
    return fields
      .map(field => this.parseField(field))
      .filter((p): p is any => p !== null);
  }

  private static parseField(field: string): any | null {
    const [nameAndOptional, typeAndComment] = field.split(':').map(s => s.trim());
    if (!nameAndOptional) return null;

    const isOptional = nameAndOptional.endsWith('?');
    const name = nameAndOptional.replace('?', '');
    if (name === 'organizationId') return null;

    const type = this.inferType(typeAndComment);

    return {
      name,
      label: name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1'),
      type,
      required: !isOptional
    };
  }

  private static inferType(typeAndComment?: string): string {
    if (!typeAndComment) return 'string';
    if (typeAndComment.includes('number')) return 'number';
    if (typeAndComment.includes('boolean')) return 'boolean';
    if (typeAndComment.includes("'") || typeAndComment.includes('"')) return 'select';
    return 'string';
  }
}

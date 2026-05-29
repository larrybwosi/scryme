import { getWindmillClientForOrg, WindmillApiClient } from './client';
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

    await this.walkTemplates(templatesDir, '', async (scriptPath, content) => {
      console.log(`Deploying template to Windmill: ${scriptPath}`);
      await client.upsertScript(`f/dealio/${scriptPath}`, content);
    });
  }

  /**
   * Provisions a new workspace for an organization and deploys templates.
   */
  static async provisionAndDeploy(organizationId: string, orgName: string, orgSlug: string) {
    const config = await prisma.windmillConfiguration.findUnique({
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

      await prisma.windmillConfiguration.update({
        where: { organizationId },
        data: {
          workspaceId: workspaceSlug,
          workspaceName: orgName,
        },
      });
    }

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
      const name = this.extractMetadata(content, 'name') || entry.name.replace(/\.(ts|js)$/, '');
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
      const windmillPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        await this.walkTemplates(fullPath, windmillPath, callback);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.js'))) {
        const content = await fs.readFile(fullPath, 'utf-8');
        const scriptPath = windmillPath.replace(/\.(ts|js)$/, '');
        await callback(scriptPath, content, entry, currentPath);
      }
    }
  }

  private static extractMetadata(content: string, key: string): string | undefined {
    const regex = new RegExp(`\\*\\s*@${key}\\s+(.+)`);
    const match = content.match(regex);
    return match ? match[1].trim() : undefined;
  }

  // fallow-ignore-next-line complexity
  private static parseParameters(content: string): any[] {
    const params: any[] = [];
    const interfaceMatch = content.match(/data:\s*{([\s\S]*?)}/);
    if (interfaceMatch) {
      const fields = interfaceMatch[1].split(/[,\n]/).map(s => s.trim()).filter(Boolean);
      for (const field of fields) {
        const [nameAndOptional, typeAndComment] = field.split(':').map(s => s.trim());
        if (!nameAndOptional) continue;

        const isOptional = nameAndOptional.endsWith('?');
        const name = nameAndOptional.replace('?', '');
        if (name === 'organizationId') continue;

        let type: any = 'string';
        if (typeAndComment?.includes('number')) type = 'number';
        else if (typeAndComment?.includes('boolean')) type = 'boolean';
        else if (typeAndComment?.includes("'") || typeAndComment?.includes('"')) type = 'select';

        params.push({
          name,
          label: name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1'),
          type,
          required: !isOptional
        });
      }
    }
    return params;
  }
}

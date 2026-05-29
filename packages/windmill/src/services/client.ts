import { db as prisma } from '@repo/db';
import { WindmillJob, WindmillWorkspace, WindmillHealthCheckResponse } from '../types';
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function getKey(): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set. Set it to a 32-character string.');
  }
  if (key.length !== 32) {
    throw new Error(`ENCRYPTION_KEY must be exactly 32 characters long (got ${key.length}).`);
  }
  return key;
}

function decrypt(text: string): string {
  const key = getKey();
  const [ivHex, authTagHex, encryptedHex] = text.split(':');
  if (!ivHex || !authTagHex || !encryptedHex) throw new Error('Invalid encrypted string format');

  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(key), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export class WindmillApiClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly workspace: string;

  constructor(baseUrl: string, apiKey: string, workspace: string = 'default') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
    this.workspace = workspace;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/api/w/${this.workspace}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        ...(options.headers ?? {}),
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Windmill API error ${res.status} on ${path}: ${text}`);
    }

    return res.json() as Promise<T>;
  }

  /**
   * Run a script asynchronously.
   */
  async runScript(path: string, args: any): Promise<string> {
    const res = await this.request<{ job_id: string }>(`/jobs/run/${path}`, {
      method: 'POST',
      body: JSON.stringify(args),
    });
    return res.job_id;
  }

  /**
   * Get job status and result.
   */
  async getJob(jobId: string): Promise<WindmillJob> {
    const res = await this.request<any>(`/jobs/get/${jobId}`);
    return {
      id: jobId,
      status: this.mapStatus(res.status),
      result: res.result,
      error: res.failure_reason,
    };
  }

  /**
   * Upsert a script (create or update).
   */
  async upsertScript(path: string, content: string, summary?: string): Promise<void> {
    await this.request(`/scripts/update/${path}`, {
      method: 'POST',
      body: JSON.stringify({
        content,
        summary: summary ?? `Auto-deployed from Dealio`,
        language: 'typescript',
      }),
    });
  }

  /**
   * Create a new workspace.
   * Note: This usually requires a global admin API key, not a workspace-scoped one.
   */
  static async createWorkspace(baseUrl: string, adminApiKey: string, name: string, slug: string): Promise<void> {
    const url = `${baseUrl.replace(/\/$/, '')}/api/workspaces/create`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminApiKey}`,
      },
      body: JSON.stringify({ name, slug }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Failed to create Windmill workspace: ${res.status} ${text}`);
    }
  }

  /**
   * Health check to verify connection to Windmill.
   */
  async healthCheck(): Promise<WindmillHealthCheckResponse> {
    const start = Date.now();
    try {
      // Windmill version endpoint is usually public or lightweight
      const res = await fetch(`${this.baseUrl}/api/version`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      const latencyMs = Date.now() - start;

      if (!res.ok) {
        return {
          ok: false,
          message: `Windmill connection failed with status ${res.status}`,
          latencyMs,
        };
      }

      return {
        ok: true,
        message: 'Windmill connection successful',
        latencyMs,
      };
    } catch (err: any) {
      return {
        ok: false,
        message: `Windmill connection error: ${err.message}`,
        latencyMs: Date.now() - start,
      };
    }
  }

  private mapStatus(status: string): WindmillJob['status'] {
    switch (status) {
      case 'waiting':
      case 'queued':
        return 'PENDING';
      case 'running':
        return 'RUNNING';
      case 'completed':
        return 'COMPLETED';
      case 'failed':
        return 'FAILED';
      case 'canceled':
        return 'CANCELLED';
      default:
        return 'PENDING';
    }
  }
}

/**
 * Factory to get a Windmill client for a specific organization.
 */
export async function getWindmillClientForOrg(organizationId: string): Promise<WindmillApiClient> {
  const config = await prisma.windmillConfiguration.findUnique({
    where: { organizationId },
  });

  if (!config) {
    throw new Error(`Windmill not configured for organization ${organizationId}`);
  }

  if (!config.workspaceId) {
    throw new Error(`Windmill workspace not provisioned for organization ${organizationId}`);
  }

  let apiKey = config.windmillApiKey;
  try {
    apiKey = decrypt(apiKey);
  } catch (err) {
    console.warn(`Failed to decrypt API key for org ${organizationId}, using as-is`);
  }

  return new WindmillApiClient(config.windmillBaseUrl, apiKey, config.workspaceId);
}

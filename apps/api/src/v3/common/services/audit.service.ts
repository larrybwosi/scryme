import { Injectable, Logger } from '@nestjs/common';

export interface AuditLog {
  timestamp: string;
  method: string;
  url: string;
  userId?: string;
  organizationId?: string;
  duration: number;
  metadata?: any;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  async log(entry: AuditLog): Promise<void> {
    // In a real enterprise scenario, this would send to an external service like Sentry, Datadog, or an Audit DB
    this.logger.log(`[Audit] ${entry.method} ${entry.url} - Org: ${entry.organizationId} - User: ${entry.userId} - ${entry.duration}ms`);

    // Simulate external service call
    try {
        // await axios.post(process.env.AUDIT_SERVICE_URL, entry);
    } catch (error) {
        this.logger.error('Failed to send audit log to external service', error);
    }
  }
}

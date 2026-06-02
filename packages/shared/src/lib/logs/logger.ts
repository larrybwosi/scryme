import { AuditLogAction, AuditEntityType, AuditLogStatus, AuditLogSeverity, db } from "@repo/db";

export interface AuditLogInput {
  organizationId?: string;
  memberId?: string;
  action: AuditLogAction;
  entityType: AuditEntityType;
  entityId: string;
  description: string;
  details?: any;
  status?: AuditLogStatus;
  severity?: AuditLogSeverity;
}

export async function createAuditLog(prisma: typeof db, input: AuditLogInput): Promise<any> {
  try {
    return await (prisma as any).auditLog.create({
      data: {
        organizationId: input.organizationId,
        memberId: input.memberId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        description: input.description,
        details: input.details,
        status: input.status ?? AuditLogStatus.SUCCESS,
        severity: input.severity ?? AuditLogSeverity.INFO,
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
    // We don't throw here to avoid failing the main transaction just because an audit log failed
    return null;
  }
}

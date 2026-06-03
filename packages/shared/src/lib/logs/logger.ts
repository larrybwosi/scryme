import { Prisma, AuditLogAction, AuditEntityType, PrismaClient } from "@repo/db";

export async function createAuditLog(
  db: Prisma.TransactionClient | PrismaClient,
  data: {
    organizationId: string;
    memberId: string;
    action: AuditLogAction;
    entityType: AuditEntityType;
    entityId: string;
    description: string;
    details?: any;
  }
) {
  return (db as any).auditLog.create({
    data: {
      organizationId: data.organizationId,
      memberId: data.memberId,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      description: data.description,
      details: data.details || {},
    },
  });
}

import { prisma as db } from "@repo/db";

export async function createAuditLog(client: any, data: any) {
  try {
    return await client.auditLog.create({
      data: {
        organizationId: data.organizationId,
        memberId: data.memberId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        description: data.description,
        metadata: data.details || {},
      },
    });
  } catch (error) {
    console.error("Failed to create audit log", error);
  }
}

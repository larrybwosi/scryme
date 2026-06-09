import 'server-only';
import { PrismaClient, CrmRelationshipType } from '@repo/db/client';

export class RelationService {
  constructor(private prisma: PrismaClient) {}

  async createRelationship(input: {
    organizationId: string;
    name: string;
    type: CrmRelationshipType;
    sourceObjectId: string;
    targetObjectId: string;
    sourceLabel: string;
    targetLabel: string;
  }) {
    return this.prisma.crmRelationshipDefinition.create({
      data: input,
    });
  }

  async associate(relationshipId: string, sourceRecordId: string, targetRecordId: string) {
    // Security: Verify the relationship definition exists
    const rel = await this.prisma.crmRelationshipDefinition.findUnique({
      where: { id: relationshipId }
    });

    if (!rel) throw new Error('Relationship definition not found');

    // Security: Verify records belong to the same organization
    const [source, target] = await Promise.all([
      this.prisma.crmRecord.findUnique({ where: { id: sourceRecordId } }),
      this.prisma.crmRecord.findUnique({ where: { id: targetRecordId } })
    ]);

    if (!source || !target) throw new Error('Source or target record not found');
    if (source.organizationId !== rel.organizationId || target.organizationId !== rel.organizationId) {
      throw new Error('Tenant isolation violation: Records must belong to the relationship organization');
    }

    return this.prisma.crmAssociation.create({
      data: {
        relationshipId,
        sourceRecordId,
        targetRecordId,
      },
    });
  }

  async getAssociations(recordId: string) {
    return this.prisma.crmAssociation.findMany({
      where: {
        OR: [
          { sourceRecordId: recordId },
          { targetRecordId: recordId },
        ],
      },
      include: {
        relationship: true,
        sourceRecord: true,
        targetRecord: true,
      },
    });
  }
}

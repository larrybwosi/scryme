import {Injectable, NotFoundException, ConflictException} from "@nestjs/common";
import {PrismaService} from "@/prisma/prisma.service";
import {
  CreateCrmRelationshipDto,
  CreateCrmAssociationDto,
} from "../dto/crm-relationships.dto";

@Injectable()
export class CrmRelationshipService {
  constructor(private readonly prisma: PrismaService) {}

  async createRelationshipDefinition(
    organizationId: string,
    dto: CreateCrmRelationshipDto,
  ) {
    const existing =
      await this.prisma.client.crmRelationshipDefinition.findFirst({
        where: {organizationId, name: dto.name},
      });

    if (existing) {
      throw new ConflictException(
        `Relationship definition with name "${dto.name}" already exists`,
      );
    }

    return this.prisma.client.crmRelationshipDefinition.create({
      data: {
        ...dto,
        organizationId,
      },
    });
  }

  async getRelationships(organizationId: string) {
    return this.prisma.client.crmRelationshipDefinition.findMany({
      where: {organizationId},
    });
  }

  async createAssociation(
    organizationId: string,
    dto: CreateCrmAssociationDto,
  ) {
    // Verify relationship exists and belongs to org
    const rel = await this.prisma.client.crmRelationshipDefinition.findFirst({
      where: {id: dto.relationshipId, organizationId},
    });

    if (!rel) {
      throw new NotFoundException("Relationship definition not found");
    }

    // Verify records belong to org (simplified check)
    const [source, target] = await Promise.all([
      this.prisma.client.crmRecord.findFirst({
        where: {id: dto.sourceRecordId, organizationId},
      }),
      this.prisma.client.crmRecord.findFirst({
        where: {id: dto.targetRecordId, organizationId},
      }),
    ]);

    if (!source || !target) {
      throw new NotFoundException("One or both records not found");
    }

    return this.prisma.client.crmAssociation.create({
      data: {
        relationshipId: dto.relationshipId,
        sourceRecordId: dto.sourceRecordId,
        targetRecordId: dto.targetRecordId,
      },
    });
  }

  async getAssociationsForRecord(organizationId: string, recordId: string) {
    return this.prisma.client.crmAssociation.findMany({
      where: {
        OR: [{sourceRecordId: recordId}, {targetRecordId: recordId}],
        relationship: {organizationId},
      },
      include: {
        relationship: true,
        sourceRecord: true,
        targetRecord: true,
      },
    });
  }
}

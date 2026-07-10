import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateCrmRecordDto, UpdateCrmRecordDto } from "../dto/crm.dto";
import {
  emitCrmRecordCreated,
  emitCrmRecordUpdated,
} from "@repo/windmill/server";

@Injectable()
export class CrmRecordService {
  constructor(private readonly prisma: PrismaService) {}

  async createRecord(
    organizationId: string,
    objectId: string,
    dto: CreateCrmRecordDto,
  ) {
    // Verify object definition exists and belongs to org
    const objectDef = await this.prisma.client.crmObjectDefinition.findFirst({
      where: { id: objectId, organizationId },
    });

    if (!objectDef) {
      throw new NotFoundException("CRM Object definition not found");
    }

    // Verify owner belongs to org if provided
    if (dto.ownerId) {
      const owner = await this.prisma.client.member.findFirst({
        where: { id: dto.ownerId, organizationId },
      });

      if (!owner) {
        throw new NotFoundException("Owner member not found");
      }
    }

    const record = await this.prisma.client.crmRecord.create({
      data: {
        organizationId,
        objectId,
        data: dto.data,
        ownerId: dto.ownerId,
      },
    });

    // Emit Windmill event
    emitCrmRecordCreated(organizationId, {
      recordId: record.id,
      entityType: "CRM_RECORD", // or record.objectId if appropriate
      name: (record.data as any)?.name || record.id,
    }).catch((err) =>
      console.error("[CRM] Failed to emit Windmill event:", err),
    );

    return record;
  }

  async updateRecord(
    organizationId: string,
    recordId: string,
    dto: UpdateCrmRecordDto,
  ) {
    const record = await this.prisma.client.crmRecord.findFirst({
      where: { id: recordId, organizationId },
    });

    if (!record) {
      throw new NotFoundException("CRM Record not found");
    }

    // Verify owner belongs to org if provided
    if (dto.ownerId) {
      const owner = await this.prisma.client.member.findFirst({
        where: { id: dto.ownerId, organizationId },
      });

      if (!owner) {
        throw new NotFoundException("Owner member not found");
      }
    }

    const updatedRecord = await this.prisma.client.crmRecord.update({
      where: { id: recordId },
      data: {
        data: dto.data !== undefined ? dto.data : undefined,
        ownerId: dto.ownerId !== undefined ? dto.ownerId : undefined,
      },
    });

    // Emit Windmill event
    emitCrmRecordUpdated(organizationId, {
      recordId: updatedRecord.id,
      entityType: "CRM_RECORD",
      name: (updatedRecord.data as any)?.name || updatedRecord.id,
      changes: dto.data,
    }).catch((err) =>
      console.error("[CRM] Failed to emit Windmill event:", err),
    );

    return updatedRecord;
  }

  async getRecord(organizationId: string, recordId: string) {
    const record = await this.prisma.client.crmRecord.findFirst({
      where: { id: recordId, organizationId },
      include: {
        owner: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    });

    if (!record) {
      throw new NotFoundException("CRM Record not found");
    }

    return record;
  }
}

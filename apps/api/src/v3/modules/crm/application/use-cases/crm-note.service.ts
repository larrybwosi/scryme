import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateCrmNoteDto } from "../dto/crm.dto";

@Injectable()
export class CrmNoteService {
  constructor(private readonly prisma: PrismaService) {}

  async createNote(
    organizationId: string,
    memberId: string | null,
    dto: CreateCrmNoteDto,
  ) {
    // Verify record exists and belongs to org
    const record = await this.prisma.client.crmRecord.findFirst({
      where: { id: dto.recordId, organizationId },
    });

    if (!record) {
      throw new NotFoundException("CRM Record not found");
    }

    return this.prisma.client.crmNote.create({
      data: {
        recordId: dto.recordId,
        organizationId,
        content: dto.content,
        createdById: memberId,
        timelineDate: dto.timelineDate
          ? new Date(dto.timelineDate)
          : new Date(),
      },
    });
  }

  async getNotesForRecord(organizationId: string, recordId: string) {
    return this.prisma.client.crmNote.findMany({
      where: { recordId, organizationId },
      orderBy: { timelineDate: "desc" },
      include: {
        createdBy: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });
  }
}

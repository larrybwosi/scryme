import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateCrmActivityDto } from "../dto/crm-activity.dto";

@Injectable()
export class CrmActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async createActivity(
    organizationId: string,
    memberId: string | null,
    dto: CreateCrmActivityDto,
  ) {
    const record = await this.prisma.client.crmRecord.findFirst({
      where: { id: dto.recordId, organizationId },
    });

    if (!record) {
      throw new NotFoundException("CRM Record not found");
    }

    return this.prisma.client.crmActivity.create({
      data: {
        recordId: dto.recordId,
        organizationId,
        type: dto.type,
        description: dto.description,
        metadata: dto.metadata,
        memberId: memberId,
      },
    });
  }

  async getTimeline(organizationId: string, recordId: string) {
    const [notes, activities] = await Promise.all([
      this.prisma.client.crmNote.findMany({
        where: { recordId, organizationId },
        // ⚡ Bolt Optimization: Use targeted select to prevent over-fetching
        // of large text blocks and unused metadata in timeline list queries.
        select: {
          id: true,
          content: true,
          timelineDate: true,
          createdBy: {
            select: { id: true, user: { select: { name: true, image: true } } },
          },
        },
      }),
      this.prisma.client.crmActivity.findMany({
        where: { recordId, organizationId },
        // ⚡ Bolt Optimization: Use targeted select to prevent over-fetching
        // of unused metadata or relations in timeline list queries.
        select: {
          id: true,
          type: true,
          description: true,
          metadata: true,
          createdAt: true,
          member: {
            select: { id: true, user: { select: { name: true, image: true } } },
          },
        },
      }),
    ]);

    // Merge and sort by date
    const timeline = [
      ...notes.map((n) => ({
        id: n.id,
        type: "NOTE",
        content: n.content,
        timestamp: n.timelineDate,
        createdBy: n.createdBy,
      })),
      ...activities.map((a) => ({
        id: a.id,
        type: a.type,
        description: a.description,
        metadata: a.metadata,
        timestamp: a.createdAt,
        createdBy: a.member,
      })),
    ];

    return timeline.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );
  }
}
